'use client';
import { motion } from 'framer-motion';

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 4l10 8-10 8V4zm11 0h3v16h-3V4z" />
    </svg>
  );
}

export default function Controls({ timer }) {
  const { isRunning, toggle, reset, skipToNext, mode } = timer;

  const modeColors = {
    work: '#6366f1',
    shortBreak: '#34d399',
    longBreak: '#fbbf24',
  };
  const color = modeColors[mode] || modeColors.work;

  return (
    <div className="flex items-center justify-center gap-3 mt-6 no-drag">
      {/* Reset */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={reset}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-card/60 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
        title="Reset"
      >
        <ResetIcon />
      </motion.button>

      {/* Play/Pause */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggle}
        className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 30px ${color}40, 0 4px 20px ${color}30`,
        }}
        title={isRunning ? 'Pause' : 'Start'}
      >
        {isRunning ? <PauseIcon /> : <PlayIcon />}
      </motion.button>

      {/* Skip */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={skipToNext}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-card/60 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
        title="Skip to next"
      >
        <SkipIcon />
      </motion.button>
    </div>
  );
}
