'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import TitleBar from '../components/TitleBar';
import Timer from '../components/Timer';
import Controls from '../components/Controls';
import FocusPal from '../components/FocusPal';
import AmbientSounds from '../components/AmbientSounds';
import Settings from '../components/Settings';

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: true,
    autoStartWork: false,
    showTimer: true,
    showPal: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zen-focus-settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zen-focus-settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleTimerComplete = useCallback((mode, sessions) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (mode === 'work') {
        window.electronAPI.showNotification(
          'Focus session complete! 🎉',
          `Great work! You've completed ${sessions} session${sessions > 1 ? 's' : ''}. Time for a break.`
        );
      } else {
        window.electronAPI.showNotification(
          'Break is over! ⚡',
          'Ready to get back to focusing?'
        );
      }
    }
  }, []);

  const timer = useTimer({
    ...settings,
    onComplete: handleTimerComplete,
  });

  const audio = useAudio();

  // Handle ambient sounds with timer state
  useEffect(() => {
    if (timer.isRunning) {
      audio.resumeAll();
    }
  }, [timer.isRunning]);

  // Listen for Electron tray commands
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    window.electronAPI.onStartFocus(() => timer.start());
    window.electronAPI.onPause(() => timer.pause());
    window.electronAPI.onReset(() => timer.reset());

    return () => {
      window.electronAPI.removeAllListeners('tray-start-focus');
      window.electronAPI.removeAllListeners('tray-pause');
      window.electronAPI.removeAllListeners('tray-reset');
    };
  }, [timer.start, timer.pause, timer.reset]);

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimize(); // Hide to tray, not quit
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Subtle animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/20"
            initial={{
              x: `${20 + i * 15}%`,
              y: '110%',
            }}
            animate={{
              y: '-10%',
              x: `${20 + i * 15 + Math.sin(i) * 10}%`,
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 2,
            }}
          />
        ))}
      </div>

      {/* Title bar */}
      <TitleBar onMinimize={handleMinimize} onClose={handleClose} />

      {/* Settings button (top right) */}
      <div className="absolute top-3 right-4 z-50">
        <Settings
          isOpen={settingsOpen}
          onToggle={() => setSettingsOpen(!settingsOpen)}
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 pb-4 overflow-y-auto">
        {/* Focus Pal */}
        <motion.div
          className="mb-2 mt-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <FocusPal
            timerMode={timer.mode}
            isRunning={timer.isRunning}
            showPal={settings.showPal}
          />
        </motion.div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Timer timer={timer} showTimer={settings.showTimer} />
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Controls timer={timer} />
        </motion.div>

        {/* Ambient Sounds */}
        <motion.div
          className="w-full mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <AmbientSounds audio={audio} />
        </motion.div>

        {/* Keyboard shortcut hint */}
        <motion.div
          className="mt-4 text-[10px] text-text-muted/50 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Cmd+Shift+F to toggle window
        </motion.div>
      </div>
    </div>
  );
}
