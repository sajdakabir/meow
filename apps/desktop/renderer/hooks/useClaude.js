'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { tauriBridge } from '../lib/tauri-bridge';

const STORAGE_KEY = 'meow-claude-enabled';
const SESSION_POLL_MS = 4000;
/** The Rust side caches for 60s, so polling faster only spins the CPU. */
const USAGE_POLL_MS = 60000;
/** Countdowns are shown to the minute, so re-render on that scale. */
const CLOCK_TICK_MS = 15000;

/**
 * Claude Code state for the notch: plan usage (how much of the session and
 * weekly allowances is left) and the sessions running on this Mac.
 *
 * Read-only in both directions — nothing here writes to ~/.claude or touches
 * the stored credential beyond reading it to make the usage request.
 */
export function useClaude() {
  const [enabled, setEnabled] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [usage, setUsage] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const sessionsInFlight = useRef(false);
  const usageInFlight = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) setEnabled(saved === 'true');
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch {}
  }, [enabled]);

  const refreshSessions = useCallback(async () => {
    // Skip if the previous poll hasn't returned — a slow disk shouldn't queue
    // up overlapping reads.
    if (sessionsInFlight.current) return;
    sessionsInFlight.current = true;
    try {
      const list = await tauriBridge.listClaudeSessions();
      setSessions(Array.isArray(list) ? list : []);
    } catch {
      setSessions([]);
    } finally {
      sessionsInFlight.current = false;
    }
  }, []);

  const refreshUsage = useCallback(async (force = false) => {
    if (usageInFlight.current) return;
    usageInFlight.current = true;
    try {
      setUsage(await tauriBridge.getClaudeUsage(force));
    } finally {
      usageInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSessions([]);
      setUsage(null);
      return;
    }
    refreshSessions();
    refreshUsage();
    const sessionTimer = setInterval(refreshSessions, SESSION_POLL_MS);
    const usageTimer = setInterval(refreshUsage, USAGE_POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => {
      clearInterval(sessionTimer);
      clearInterval(usageTimer);
      clearInterval(clock);
    };
  }, [enabled, refreshSessions, refreshUsage]);

  const limits = usage?.limits ?? [];
  const session = limits.find(l => l.kind === 'session') ?? null;

  return {
    enabled,
    setEnabled,
    sessions,
    count: sessions.length,
    workingCount: sessions.filter(s => s.working).length,
    usage,
    limits,
    /** The five-hour window — what "how much is left right now" means. */
    session,
    sessionLeft: session ? Math.max(0, 100 - session.percent_used) : null,
    plan: usage?.plan ?? null,
    usageError: usage?.error ?? null,
    now,
    refreshSessions,
    refreshUsage,
  };
}

/** "just now" / "3m" / "2h" / "4d" — compact enough for the notch. */
export function formatIdle(seconds) {
  if (seconds == null) return '';
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** Time until an ISO-8601 reset stamp: "1h 23m", "12m", "2d 3h". */
export function formatResetIn(resetsAt, now = Date.now()) {
  if (!resetsAt) return '';
  const ms = new Date(resetsAt).getTime() - now;
  if (!Number.isFinite(ms)) return '';
  if (ms <= 0) return 'now';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rem = minutes % 60;
    return rem ? `${hours}h ${rem}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem ? `${days}d ${rem}h` : `${days}d`;
}

/**
 * Bar colour for a limit. The API's own severity wins when it flags something;
 * otherwise fall back to how much is left.
 */
export function usageColor(limit) {
  if (!limit) return '#4ade80';
  if (limit.severity === 'critical' || limit.severity === 'exceeded') return '#f87171';
  if (limit.severity === 'warning') return '#fbbf24';
  const left = 100 - limit.percent_used;
  if (left <= 10) return '#f87171';
  if (left <= 25) return '#fbbf24';
  return '#4ade80';
}
