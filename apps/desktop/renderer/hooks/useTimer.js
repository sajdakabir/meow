'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(settings = {}) {
  const { minutes: initialMinutes = 25, onComplete } = settings;

  const [minutes, setMinutes] = useState(initialMinutes);
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef(null);

  const totalTime = minutes * 60;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

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

  const handleComplete = useCallback(() => {
    stop();
    const newCompleted = completedSessions + 1;
    setCompletedSessions(newCompleted);
    setTimeLeft(minutes * 60);
    onComplete?.(newCompleted);
  }, [completedSessions, minutes, stop, onComplete]);

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
    setTimeLeft(minutes * 60);
  }, [stop, minutes]);

  // Update timeLeft when minutes change and not running
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(minutes * 60);
    }
  }, [minutes]);

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
  };
}
