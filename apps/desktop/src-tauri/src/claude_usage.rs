//! Claude plan usage — the numbers behind Claude Code's `/usage` screen.
//!
//! There is no local cache to read: Claude Code fetches this live from
//! `https://api.anthropic.com/api/oauth/usage`, authenticated with the OAuth
//! token it keeps in the login keychain. So meow does the same.
//!
//! Two deliberate choices about the credential:
//!   * it is read on demand and never written to disk or kept in app state,
//!   * it is handed to curl through a stdin config file rather than argv, so
//!     it never appears in the process list.
//!
//! meow only ever reads the token — it never refreshes or rewrites it, which
//! would rotate the token out from under Claude Code itself. When the token
//! has expired the UI says so and the user re-authenticates in Claude Code.
//!
//! The endpoint is internal and undocumented, so everything here fails soft:
//! any breakage surfaces as an `error` string on an otherwise empty payload
//! rather than as a broken notch.

use serde::Serialize;
use std::process::{Command, Stdio};
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};

const USAGE_URL: &str = "https://api.anthropic.com/api/oauth/usage";
const OAUTH_BETA: &str = "anthropic-beta: oauth-2025-04-20";
const KEYCHAIN_SERVICE: &str = "Claude Code-credentials";
/// Usage moves slowly; don't hammer the endpoint on every UI poll.
const CACHE_TTL_SECS: u64 = 60;
const CURL_TIMEOUT_SECS: u64 = 10;

#[derive(Serialize, Clone)]
pub struct UsageLimit {
    /// Raw kind from the API: "session", "weekly_all", "weekly_scoped", …
    pub kind: String,
    /// Display label, e.g. "Current session" or "Weekly · Fable".
    pub label: String,
    /// Percentage of the allowance consumed (0–100).
    pub percent_used: f64,
    /// API-supplied severity: "normal", "warning", … Used to colour the bar
    /// when the API flags a limit before our own thresholds would.
    pub severity: String,
    /// ISO-8601 reset time; the frontend formats the countdown so it can tick
    /// without re-fetching.
    pub resets_at: Option<String>,
}

#[derive(Serialize, Clone, Default)]
pub struct ClaudeUsage {
    pub limits: Vec<UsageLimit>,
    /// Human plan name, e.g. "Max (5x)".
    pub plan: Option<String>,
    /// Unix seconds when this payload was fetched.
    pub fetched_at: u64,
    /// Set when usage could not be read; `limits` is empty in that case.
    pub error: Option<String>,
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn cache() -> &'static Mutex<Option<ClaudeUsage>> {
    static CACHE: OnceLock<Mutex<Option<ClaudeUsage>>> = OnceLock::new();
    CACHE.get_or_init(|| Mutex::new(None))
}

/// The OAuth blob Claude Code stores, as much of it as we need.
struct Credentials {
    access_token: String,
    /// e.g. "default_claude_max_5x"
    rate_limit_tier: Option<String>,
    /// e.g. "max"
    subscription_type: Option<String>,
    /// Unix millis.
    expires_at: Option<u64>,
}

/// Read the credential JSON, preferring the login keychain (where Claude Code
/// puts it on macOS) and falling back to `~/.claude/.credentials.json`.
fn read_credentials() -> Result<Credentials, String> {
    // The keychain read pops a macOS access prompt the first time. Denying it
    // and never having signed in look identical from here, so the message
    // covers both rather than guessing.
    let raw = match read_from_keychain() {
        Ok(raw) => raw,
        Err(keychain_err) => read_from_file().map_err(|_| {
            if cfg!(target_os = "macos") {
                "Can't read Claude Code's credentials — allow meow access to the \
                 \"Claude Code-credentials\" keychain item, or sign in to Claude Code"
                    .to_string()
            } else {
                keychain_err
            }
        })?,
    };

    let value: serde_json::Value =
        serde_json::from_str(&raw).map_err(|_| "credentials are not valid JSON".to_string())?;
    let oauth = value
        .get("claudeAiOauth")
        .ok_or("no Claude Code OAuth credentials found")?;

    let access_token = oauth
        .get("accessToken")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .ok_or("no access token in credentials")?
        .to_string();

    Ok(Credentials {
        access_token,
        rate_limit_tier: oauth
            .get("rateLimitTier")
            .and_then(|v| v.as_str())
            .map(str::to_string),
        subscription_type: oauth
            .get("subscriptionType")
            .and_then(|v| v.as_str())
            .map(str::to_string),
        expires_at: oauth.get("expiresAt").and_then(|v| v.as_u64()),
    })
}

#[cfg(target_os = "macos")]
fn read_from_keychain() -> Result<String, String> {
    let out = Command::new("/usr/bin/security")
        .args(["find-generic-password", "-s", KEYCHAIN_SERVICE, "-w"])
        .output()
        .map_err(|e| format!("keychain lookup failed: {e}"))?;
    if !out.status.success() {
        return Err("no keychain entry for Claude Code".to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

#[cfg(not(target_os = "macos"))]
fn read_from_keychain() -> Result<String, String> {
    Err("keychain is macOS-only".to_string())
}

fn read_from_file() -> Result<String, String> {
    let home = std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .ok_or("no home directory")?;
    let path = std::path::PathBuf::from(home)
        .join(".claude")
        .join(".credentials.json");
    std::fs::read_to_string(path).map_err(|_| "Claude Code isn't signed in on this Mac".to_string())
}

/// "default_claude_max_5x" → "Max (5x)".
fn plan_label(tier: Option<&str>, subscription: Option<&str>) -> Option<String> {
    if let Some(tier) = tier {
        let short = tier.trim_start_matches("default_claude_");
        let label = match short {
            "max_5x" => Some("Max (5x)".to_string()),
            "max_20x" => Some("Max (20x)".to_string()),
            "pro" => Some("Pro".to_string()),
            "free" => Some("Free".to_string()),
            _ => None,
        };
        if label.is_some() {
            return label;
        }
    }
    subscription.map(|s| {
        let mut chars = s.chars();
        match chars.next() {
            Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            None => s.to_string(),
        }
    })
}

/// GET the usage endpoint. The token goes in via a stdin curl config so it
/// stays out of the process list.
fn fetch_usage(token: &str) -> Result<serde_json::Value, String> {
    use std::io::Write;

    let mut child = Command::new("/usr/bin/curl")
        .args([
            "--config",
            "-",
            "--silent",
            "--show-error",
            "--max-time",
            &CURL_TIMEOUT_SECS.to_string(),
            "--write-out",
            "\n%{http_code}",
        ])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("could not run curl: {e}"))?;

    {
        let stdin = child.stdin.as_mut().ok_or("curl stdin unavailable")?;
        let config = format!(
            "url = \"{USAGE_URL}\"\nheader = \"Authorization: Bearer {token}\"\nheader = \"{OAUTH_BETA}\"\n"
        );
        stdin
            .write_all(config.as_bytes())
            .map_err(|e| format!("could not send request: {e}"))?;
    }

    let out = child
        .wait_with_output()
        .map_err(|e| format!("request failed: {e}"))?;
    if !out.status.success() {
        return Err("could not reach the usage endpoint".to_string());
    }

    // Body, then the status code appended by --write-out on its own line.
    let combined = String::from_utf8_lossy(&out.stdout);
    let (body, status) = combined
        .rsplit_once('\n')
        .ok_or("malformed response from the usage endpoint")?;

    match status.trim() {
        "200" => {}
        "401" | "403" => {
            return Err("Claude Code sign-in expired — open Claude Code to refresh".to_string())
        }
        "429" => return Err("rate limited by the usage endpoint".to_string()),
        other => return Err(format!("usage endpoint returned {other}")),
    }

    serde_json::from_str(body).map_err(|_| "could not parse the usage response".to_string())
}

fn limit_label(kind: &str, entry: &serde_json::Value) -> String {
    match kind {
        "session" => "Current session".to_string(),
        "weekly_all" => "Weekly · all models".to_string(),
        "weekly_scoped" => entry
            .get("scope")
            .and_then(|s| s.get("model"))
            .and_then(|m| m.get("display_name"))
            .and_then(|v| v.as_str())
            .map(|name| format!("Weekly · {name}"))
            .unwrap_or_else(|| "Weekly · scoped".to_string()),
        other => other.replace('_', " "),
    }
}

/// Prefer the API's own `limits` array — it already carries labels, severity
/// and scope. Fall back to the older flat fields if a response omits it.
fn parse_limits(payload: &serde_json::Value) -> Vec<UsageLimit> {
    if let Some(entries) = payload.get("limits").and_then(|v| v.as_array()) {
        let limits: Vec<UsageLimit> = entries
            .iter()
            .filter_map(|entry| {
                let kind = entry.get("kind").and_then(|v| v.as_str())?;
                Some(UsageLimit {
                    label: limit_label(kind, entry),
                    kind: kind.to_string(),
                    percent_used: entry.get("percent").and_then(|v| v.as_f64()).unwrap_or(0.0),
                    severity: entry
                        .get("severity")
                        .and_then(|v| v.as_str())
                        .unwrap_or("normal")
                        .to_string(),
                    resets_at: entry
                        .get("resets_at")
                        .and_then(|v| v.as_str())
                        .map(str::to_string),
                })
            })
            .collect();
        if !limits.is_empty() {
            return limits;
        }
    }

    [
        ("five_hour", "session", "Current session"),
        ("seven_day", "weekly_all", "Weekly · all models"),
        ("seven_day_opus", "weekly_scoped", "Weekly · Opus"),
    ]
    .iter()
    .filter_map(|(field, kind, label)| {
        let entry = payload.get(field)?;
        Some(UsageLimit {
            kind: kind.to_string(),
            label: label.to_string(),
            percent_used: entry.get("utilization").and_then(|v| v.as_f64())?,
            severity: "normal".to_string(),
            resets_at: entry
                .get("resets_at")
                .and_then(|v| v.as_str())
                .map(str::to_string),
        })
    })
    .collect()
}

fn load_usage() -> ClaudeUsage {
    let fetched_at = now_secs();

    let creds = match read_credentials() {
        Ok(c) => c,
        Err(e) => {
            return ClaudeUsage {
                fetched_at,
                error: Some(e),
                ..Default::default()
            }
        }
    };

    let plan = plan_label(
        creds.rate_limit_tier.as_deref(),
        creds.subscription_type.as_deref(),
    );

    // Cheap pre-check so an expired token reads as a sign-in problem rather
    // than a mysterious 401.
    if creds.expires_at.is_some_and(|ms| ms / 1000 <= fetched_at) {
        return ClaudeUsage {
            plan,
            fetched_at,
            error: Some("Claude Code sign-in expired — open Claude Code to refresh".to_string()),
            ..Default::default()
        };
    }

    match fetch_usage(&creds.access_token) {
        Ok(payload) => ClaudeUsage {
            limits: parse_limits(&payload),
            plan,
            fetched_at,
            error: None,
        },
        Err(e) => ClaudeUsage {
            plan,
            fetched_at,
            error: Some(e),
            ..Default::default()
        },
    }
}

/// Current Claude plan usage, cached for a minute. `force` refetches now.
#[tauri::command]
pub async fn claude_usage(force: bool) -> Result<ClaudeUsage, String> {
    if !force {
        if let Ok(guard) = cache().lock() {
            if let Some(cached) = guard.as_ref() {
                // Failures expire fast so a transient network blip doesn't
                // stick around for a full minute.
                let ttl = if cached.error.is_some() { 10 } else { CACHE_TTL_SECS };
                if now_secs().saturating_sub(cached.fetched_at) < ttl {
                    return Ok(cached.clone());
                }
            }
        }
    }

    let usage = tauri::async_runtime::spawn_blocking(load_usage)
        .await
        .map_err(|e| e.to_string())?;

    if let Ok(mut guard) = cache().lock() {
        *guard = Some(usage.clone());
    }
    Ok(usage)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn labels_known_plan_tiers() {
        assert_eq!(
            plan_label(Some("default_claude_max_5x"), Some("max")).as_deref(),
            Some("Max (5x)")
        );
        assert_eq!(plan_label(Some("default_claude_pro"), None).as_deref(), Some("Pro"));
        // Unknown tier falls back to the subscription name.
        assert_eq!(
            plan_label(Some("default_claude_something_new"), Some("max")).as_deref(),
            Some("Max")
        );
        assert_eq!(plan_label(None, None), None);
    }

    #[test]
    fn parses_the_limits_array() {
        let payload = serde_json::json!({
            "limits": [
                {"kind": "session", "percent": 21, "severity": "normal",
                 "resets_at": "2026-08-15T11:40:00+00:00"},
                {"kind": "weekly_all", "percent": 63, "severity": "normal",
                 "resets_at": "2026-08-16T15:00:00+00:00"},
                {"kind": "weekly_scoped", "percent": 13, "severity": "warning",
                 "resets_at": null,
                 "scope": {"model": {"display_name": "Fable"}}}
            ]
        });
        let limits = parse_limits(&payload);
        assert_eq!(limits.len(), 3);
        assert_eq!(limits[0].label, "Current session");
        assert_eq!(limits[0].percent_used, 21.0);
        assert_eq!(limits[1].label, "Weekly · all models");
        assert_eq!(limits[2].label, "Weekly · Fable");
        assert_eq!(limits[2].severity, "warning");
        assert!(limits[2].resets_at.is_none());
    }

    /// Hits the real keychain and the real endpoint, so it is opt-in:
    /// `cargo test -- --ignored --nocapture`.
    #[test]
    #[ignore = "requires network and a signed-in Claude Code"]
    fn fetches_live_usage() {
        let usage = load_usage();
        println!("plan: {:?} error: {:?}", usage.plan, usage.error);
        for l in &usage.limits {
            println!(
                "{:<24} {:>5.0}% used  resets_at={:?}  severity={}",
                l.label, l.percent_used, l.resets_at, l.severity
            );
        }
        assert!(usage.error.is_none(), "usage fetch failed: {:?}", usage.error);
        assert!(!usage.limits.is_empty());
        assert!(usage.limits.iter().any(|l| l.kind == "session"));
    }

    #[test]
    fn falls_back_to_flat_fields_without_limits() {
        let payload = serde_json::json!({
            "five_hour": {"utilization": 21.0, "resets_at": "2026-08-15T11:40:00+00:00"},
            "seven_day": {"utilization": 63.0, "resets_at": null},
            "seven_day_opus": null
        });
        let limits = parse_limits(&payload);
        assert_eq!(limits.len(), 2);
        assert_eq!(limits[0].kind, "session");
        assert_eq!(limits[1].percent_used, 63.0);
    }
}
