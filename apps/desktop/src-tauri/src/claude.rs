//! Live Claude Code session discovery.
//!
//! Claude Code writes one JSON file per running session to
//! `~/.claude/sessions/<pid>.json` and appends its transcript to
//! `~/.claude/projects/<slug>/<sessionId>.jsonl`. Nothing in there marks a
//! session as finished — the file is simply left behind when the process
//! exits — so liveness is decided by whether the recorded pid still exists.
//!
//! "Working" vs "idle" isn't recorded either. We approximate it from the
//! transcript's mtime: Claude appends as it works, so a file touched in the
//! last few seconds means something is happening right now.

use serde::Serialize;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// A session is treated as actively working if its transcript was written to
/// within this many seconds. Long tool calls can exceed it, in which case the
/// session reads as idle until the next append — acceptable for a glanceable
/// indicator.
const WORKING_WINDOW_SECS: u64 = 20;

#[derive(Serialize)]
pub struct ClaudeSession {
    pub pid: u32,
    pub session_id: String,
    /// Derived short name, e.g. "meow-da".
    pub name: String,
    /// Absolute working directory of the session.
    pub cwd: String,
    /// Last path component of `cwd`, for compact display.
    pub project: String,
    /// Unix millis the session started, if recorded.
    pub started_at: Option<u64>,
    /// Seconds since the transcript was last appended to; `None` when no
    /// transcript file was found.
    pub idle_seconds: Option<u64>,
    /// True when the transcript changed within `WORKING_WINDOW_SECS`.
    pub working: bool,
}

fn claude_home() -> Option<PathBuf> {
    let home = std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))?;
    Some(PathBuf::new().join(home).join(".claude"))
}

/// True when a process with this pid currently exists.
#[cfg(unix)]
fn pid_alive(pid: u32) -> bool {
    // signal 0 performs the existence/permission check without delivering.
    unsafe { libc::kill(pid as libc::pid_t, 0) == 0 }
}

#[cfg(not(unix))]
fn pid_alive(_pid: u32) -> bool {
    // No cheap equivalent off unix; assume live and let the transcript age
    // carry the signal instead.
    true
}

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

/// Seconds since `path` was last modified.
fn age_secs(path: &Path) -> Option<u64> {
    let modified = std::fs::metadata(path).ok()?.modified().ok()?;
    let secs = modified.duration_since(UNIX_EPOCH).ok()?.as_secs();
    Some(now_secs().saturating_sub(secs))
}

/// Locate `<sessionId>.jsonl` under any project slug directory.
///
/// The slug is derived from the cwd, but the derivation has changed across
/// Claude Code versions, so we scan rather than reconstruct it.
fn find_transcript(claude_dir: &Path, session_id: &str) -> Option<PathBuf> {
    let projects = claude_dir.join("projects");
    let file_name = format!("{}.jsonl", session_id);
    for entry in std::fs::read_dir(projects).ok()? {
        let Ok(entry) = entry else { continue };
        let candidate = entry.path().join(&file_name);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

/// List Claude Code sessions whose process is still running, most recently
/// active first. Returns an empty list when Claude Code isn't installed.
#[tauri::command]
pub async fn list_claude_sessions() -> Result<Vec<ClaudeSession>, String> {
    Ok(collect_sessions())
}

fn collect_sessions() -> Vec<ClaudeSession> {
    let Some(claude_dir) = claude_home() else {
        return Vec::new();
    };

    let entries = match std::fs::read_dir(claude_dir.join("sessions")) {
        Ok(entries) => entries,
        // No sessions directory at all — Claude Code has never run here.
        Err(_) => return Vec::new(),
    };

    let mut sessions = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }

        let Ok(raw) = std::fs::read_to_string(&path) else { continue };
        let Ok(value) = serde_json::from_str::<serde_json::Value>(&raw) else { continue };

        let Some(pid) = value.get("pid").and_then(|v| v.as_u64()) else { continue };
        let Some(session_id) = value.get("sessionId").and_then(|v| v.as_str()) else { continue };

        if !pid_alive(pid as u32) {
            continue;
        }

        let cwd = value.get("cwd").and_then(|v| v.as_str()).unwrap_or("");
        let project = Path::new(cwd)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or(cwd)
            .to_string();

        let name = value
            .get("name")
            .and_then(|v| v.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                if project.is_empty() {
                    session_id.chars().take(8).collect()
                } else {
                    project.clone()
                }
            });

        let idle_seconds =
            find_transcript(&claude_dir, session_id).and_then(|p| age_secs(&p));

        sessions.push(ClaudeSession {
            pid: pid as u32,
            session_id: session_id.to_string(),
            name,
            cwd: cwd.to_string(),
            project,
            started_at: value.get("startedAt").and_then(|v| v.as_u64()),
            working: idle_seconds.is_some_and(|s| s < WORKING_WINDOW_SECS),
            idle_seconds,
        });
    }

    // Most recently active first; sessions with no transcript sink to the end.
    sessions.sort_by_key(|s| s.idle_seconds.unwrap_or(u64::MAX));

    sessions
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Exercises the real ~/.claude on the developer's machine. Asserts only
    /// invariants that hold whether or not Claude Code is installed, and
    /// prints the result for `cargo test -- --nocapture` inspection.
    #[test]
    fn collects_live_sessions() {
        let sessions = collect_sessions();
        for s in &sessions {
            assert!(!s.session_id.is_empty());
            assert!(!s.name.is_empty());
            assert!(pid_alive(s.pid), "listed a dead pid: {}", s.pid);
            assert_eq!(
                s.working,
                s.idle_seconds.is_some_and(|v| v < WORKING_WINDOW_SECS)
            );
            println!(
                "{:>7} {:<24} {:<32} idle={:?} working={}",
                s.pid, s.name, s.project, s.idle_seconds, s.working
            );
        }
        // Sorted most-recently-active first.
        let keys: Vec<u64> = sessions
            .iter()
            .map(|s| s.idle_seconds.unwrap_or(u64::MAX))
            .collect();
        assert!(keys.windows(2).all(|w| w[0] <= w[1]));
    }
}
