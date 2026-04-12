'use client';
import { useState, useEffect, useCallback } from 'react';
import { tauriBridge } from '../../lib/tauri-bridge';
import EyeBreakOverlay from '../../components/EyeBreakOverlay';

export default function EyeBreakPage() {
  const [breakTimeLeft, setBreakTimeLeft] = useState(20);
  const [palIcon, setPalIcon] = useState('👀');

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
          // Auto-close when break is done
          tauriBridge.closeEyeBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = useCallback(() => {
    tauriBridge.closeEyeBreak();
  }, []);

  const handleSnooze = useCallback((minutes) => {
    // Emit snooze event to the main popover window, then close overlay
    const t = tauriBridge.getTauri();
    if (t) {
      t.event.emit('eye-break-snoozed', { minutes });
    }
    tauriBridge.closeEyeBreak();
  }, []);

  return (
    <EyeBreakOverlay
      isActive={true}
      breakTimeLeft={breakTimeLeft}
      onDismiss={handleDismiss}
      onSnooze={handleSnooze}
      palIcon={palIcon}
    />
  );
}
