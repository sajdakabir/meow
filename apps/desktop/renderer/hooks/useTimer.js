'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(settings = {}) {
  const {
    minutes: initialMinutes = 25,
    pomodoroMode = false,
    workMinutes = 25,
    shortBreakMinutes = 5,
    longBreakMinutes = 15,
    longBreakInterval = 4,
    onComplete,
  } = settings;

  const [mode, setMode] = useState('work'); // work | shortBreak | longBreak
  const [minutes, setMinutes] = useState(initialMinutes);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef(null);

  const getCurrentDuration = useCallback(() => {
    if (!pomodoroMode) return minutes * 60;
    switch (mode) {
      case 'work': return workMinutes * 60;
      case 'shortBreak': return shortBreakMinutes * 60;
      case 'longBreak': return longBreakMinutes * 60;
      default: return workMinutes * 60;
    }
  }, [pomodoroMode, minutes, mode, workMinutes, shortBreakMinutes, longBreakMinutes]);

  const totalTime = getCurrentDuration();
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const modeLabel = pomodoroMode
    ? (mode === 'work' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break')
    : '';

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const setDuration = useCallback((newMinutes) => {
    setMinutes(newMinutes);
    if (!isRunning) {
      setTimeLeft(newMinutes * 60);
    }
  }, [isRunning]);

  const switchMode = useCallback((newMode) => {
    stop();
    setMode(newMode);
    const dur = newMode === 'work' ? workMinutes : newMode === 'shortBreak' ? shortBreakMinutes : longBreakMinutes;
    setTimeLeft(dur * 60);
  }, [stop, workMinutes, shortBreakMinutes, longBreakMinutes]);

  const handleComplete = useCallback(() => {
    stop();
    const newCompleted = completedSessions + 1;
    setCompletedSessions(newCompleted);

    if (pomodoroMode) {
      if (mode === 'work') {
        const isLongBreak = newCompleted % longBreakInterval === 0;
        const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
        onComplete?.('work', newCompleted);
        switchMode(nextMode);
      } else {
        onComplete?.(mode, completedSessions);
        switchMode('work');
      }
    } else {
      setTimeLeft(minutes * 60);
      onComplete?.(newCompleted);
    }
  }, [completedSessions, minutes, mode, pomodoroMode, longBreakInterval, stop, switchMode, onComplete]);

  const start = useCallback(() => {
    if (timeLeft <= 0) return;
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    stop();
  }, [stop]);

  const toggle = useCallback(() => {
    if (isRunning) pause();
    else start();
  }, [isRunning, pause, start]);

  const reset = useCallback(() => {
    stop();
    if (pomodoroMode) {
      const dur = mode === 'work' ? workMinutes : mode === 'shortBreak' ? shortBreakMinutes : longBreakMinutes;
      setTimeLeft(dur * 60);
    } else {
      setTimeLeft(minutes * 60);
    }
  }, [stop, pomodoroMode, mode, minutes, workMinutes, shortBreakMinutes, longBreakMinutes]);

  // Update timeLeft when duration settings change (only when not running)
  // Use a ref to track if we're just pausing vs actually changing settings
  const prevSettingsRef = useRef({ minutes, workMinutes, shortBreakMinutes, longBreakMinutes, pomodoroMode });
  useEffect(() => {
    const prev = prevSettingsRef.current;
    const settingsChanged =
      prev.minutes !== minutes ||
      prev.workMinutes !== workMinutes ||
      prev.shortBreakMinutes !== shortBreakMinutes ||
      prev.longBreakMinutes !== longBreakMinutes ||
      prev.pomodoroMode !== pomodoroMode;
    prevSettingsRef.current = { minutes, workMinutes, shortBreakMinutes, longBreakMinutes, pomodoroMode };

    if (!isRunning && settingsChanged) {
      if (pomodoroMode) {
        const dur = mode === 'work' ? workMinutes : mode === 'shortBreak' ? shortBreakMinutes : longBreakMinutes;
        setTimeLeft(dur * 60);
      } else {
        setTimeLeft(minutes * 60);
      }
    }
  }, [minutes, workMinutes, shortBreakMinutes, longBreakMinutes, pomodoroMode]);

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

  return {
    mode,
    modeLabel,
    minutes,
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
    setDuration,
    switchMode,
  };
}
