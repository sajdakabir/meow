'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

const TIMER_MODES = {
  work: { label: 'Focus', defaultMinutes: 25 },
  shortBreak: { label: 'Short Break', defaultMinutes: 5 },
  longBreak: { label: 'Long Break', defaultMinutes: 15 },
};

export function useTimer(settings = {}) {
  const {
    workMinutes = 25,
    shortBreakMinutes = 5,
    longBreakMinutes = 15,
    autoStartBreaks = true,
    autoStartWork = false,
    longBreakInterval = 4,
    onComplete,
  } = settings;

  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef(null);

  const getDuration = useCallback((m) => {
    switch (m) {
      case 'work': return workMinutes * 60;
      case 'shortBreak': return shortBreakMinutes * 60;
      case 'longBreak': return longBreakMinutes * 60;
      default: return workMinutes * 60;
    }
  }, [workMinutes, shortBreakMinutes, longBreakMinutes]);

  const totalTime = getDuration(mode);
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const switchMode = useCallback((newMode, autoStart = false) => {
    stop();
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
    if (autoStart) {
      // Will be started by the effect
      setTimeout(() => setIsRunning(true), 100);
    }
  }, [stop, getDuration]);

  const handleComplete = useCallback(() => {
    stop();

    if (mode === 'work') {
      const newCompleted = completedSessions + 1;
      setCompletedSessions(newCompleted);

      const isLongBreak = newCompleted % longBreakInterval === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      const modeLabel = isLongBreak ? 'Long Break' : 'Short Break';

      onComplete?.('work', newCompleted);
      switchMode(nextMode, autoStartBreaks);
    } else {
      onComplete?.(mode, completedSessions);
      switchMode('work', autoStartWork);
    }
  }, [mode, completedSessions, longBreakInterval, autoStartBreaks, autoStartWork, stop, switchMode, onComplete]);

  const start = useCallback(() => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(getDuration(mode));
  }, [stop, getDuration, mode]);

  const skipToNext = useCallback(() => {
    if (mode === 'work') {
      const isLongBreak = (completedSessions + 1) % longBreakInterval === 0;
      switchMode(isLongBreak ? 'longBreak' : 'shortBreak');
    } else {
      switchMode('work');
    }
  }, [mode, completedSessions, longBreakInterval, switchMode]);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleComplete]);

  // Update tray title when timer is running
  useEffect(() => {
    import('../lib/tauri-bridge').then(({ tauriBridge }) => {
      tauriBridge.updateTrayTitle(isRunning ? display : '');
    });
  }, [display, isRunning]);

  return {
    mode,
    modeLabel: TIMER_MODES[mode]?.label || 'Focus',
    timeLeft,
    display,
    isRunning,
    progress,
    completedSessions,
    totalTime,
    start,
    pause,
    toggle,
    reset,
    skipToNext,
    switchMode,
    setMode: (m) => switchMode(m),
  };
}
