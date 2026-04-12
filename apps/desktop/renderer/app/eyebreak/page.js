'use client';
import { useState, useEffect, useCallback } from 'react';
import { tauriBridge } from '../../lib/tauri-bridge';
import EyeBreakOverlay from '../../components/EyeBreakOverlay';

export default function EyeBreakPage() {
  // Parse query params: ?duration=20&strict=true
  const [duration, setDuration] = useState(20);
  const [strict, setStrict] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(20);
  const [palIcon, setPalIcon] = useState('👀');

  // Read URL params once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const d = parseInt(params.get('duration') || '20', 10);
    const s = params.get('strict') === 'true';
    setDuration(d);
    setBreakTimeLeft(d);
    setStrict(s);
  }, []);

  // Load pal from localStorage
  useEffect(() => {
    const PALS = ['🐱', '🦊', '🦉', '🐼', '🐰'];
    try {
      const saved = localStorage.getItem('meow-pal');
      if (saved) setPalIcon(PALS[parseInt(saved, 10)] || '👀');
    } catch {}
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          tauriBridge.closeEyeBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = useCallback(() => {
    if (strict) return; // no-op in strict mode
    tauriBridge.closeEyeBreak();
  }, [strict]);

  const handleSnooze = useCallback((minutes) => {
    if (strict) return; // no-op in strict mode
    const t = tauriBridge.getTauri();
    if (t) {
      t.event.emit('eye-break-snoozed', { minutes });
    }
    tauriBridge.closeEyeBreak();
  }, [strict]);

  return (
    <EyeBreakOverlay
      isActive={true}
      breakTimeLeft={breakTimeLeft}
      totalDuration={duration}
      strict={strict}
      onDismiss={handleDismiss}
      onSnooze={handleSnooze}
      palIcon={palIcon}
    />
  );
}
