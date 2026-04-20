'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'meow-eyebreak';

const DEFAULTS = {
  enabled: true,
  intervalMinutes: 20,  // 20-20-20 rule: every 20 minutes
  breakDurationSeconds: 20, // look away for 20 seconds
  strictMode: false, // when true, user cannot skip/snooze the break
};

export function useEyeBreak({ onBreakDue, onBreakEnd } = {}) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const [timeSinceLastBreak, setTimeSinceLastBreak] = useState(0); // seconds

  const intervalRef = useRef(null);
  const breakTimerRef = useRef(null);
  const snoozedUntilRef = useRef(0);

  // Keep latest callbacks in refs so interval effects don't tear down
  // and rebuild on every parent re-render (which would freeze the countdown
  // when the parent renders faster than 1Hz, e.g. while the focus timer ticks).
  const onBreakDueRef = useRef(onBreakDue);
  const onBreakEndRef = useRef(onBreakEnd);
  useEffect(() => { onBreakDueRef.current = onBreakDue; }, [onBreakDue]);
  useEffect(() => { onBreakEndRef.current = onBreakEnd; }, [onBreakEnd]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(s => ({ ...s, ...parsed }));
      }
    } catch {}
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const updateSettings = useCallback((updates) => {
    setSettings(s => ({ ...s, ...updates }));
  }, []);

  // Start an eye break
  const startBreak = useCallback(() => {
    setIsBreakActive(true);
    setBreakTimeLeft(settings.breakDurationSeconds);
    setTimeSinceLastBreak(0);
    onBreakDueRef.current?.();
  }, [settings.breakDurationSeconds]);

  // End / dismiss the break
  const dismissBreak = useCallback(() => {
    if (breakTimerRef.current) {
      clearInterval(breakTimerRef.current);
      breakTimerRef.current = null;
    }
    setIsBreakActive(false);
    setBreakTimeLeft(0);
    setTimeSinceLastBreak(0);
    onBreakEndRef.current?.();
  }, []);

  // Snooze — delay next break by N minutes
  const snooze = useCallback((minutes) => {
    dismissBreak();
    snoozedUntilRef.current = Date.now() + minutes * 60 * 1000;
    setTimeSinceLastBreak(0);
  }, [dismissBreak]);

  // Break countdown timer
  useEffect(() => {
    if (!isBreakActive) return;

    breakTimerRef.current = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          dismissBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
      }
    };
  }, [isBreakActive, dismissBreak]);

  // Main interval — tick every second whenever the feature is enabled.
  useEffect(() => {
    if (!settings.enabled || isBreakActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      // Check if still snoozed
      if (snoozedUntilRef.current > Date.now()) return;

      setTimeSinceLastBreak(prev => {
        const next = prev + 1;
        if (next >= settings.intervalMinutes * 60) {
          startBreak();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.enabled, settings.intervalMinutes, isBreakActive, startBreak]);

  // Progress toward next break (0 to 1)
  const progress = settings.enabled
    ? Math.min(timeSinceLastBreak / (settings.intervalMinutes * 60), 1)
    : 0;

  // Seconds until next break
  const secondsUntilBreak = Math.max(
    0,
    settings.intervalMinutes * 60 - timeSinceLastBreak
  );

  // Minutes until next break (rounded up — kept for compatibility)
  const minutesUntilBreak = Math.ceil(secondsUntilBreak / 60);

  // Formatted MM:SS countdown until next break
  const nextBreakDisplay = (() => {
    const mins = Math.floor(secondsUntilBreak / 60);
    const secs = secondsUntilBreak % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  })();

  return {
    settings,
    updateSettings,
    isBreakActive,
    breakTimeLeft,
    progress,
    minutesUntilBreak,
    secondsUntilBreak,
    nextBreakDisplay,
    startBreak,
    dismissBreak,
    snooze,
  };
}
