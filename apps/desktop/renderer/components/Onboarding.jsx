'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    title: 'Welcome to meow!',
    desc: 'Let\u2019s take a quick tour so you know where everything is.',
    icon: '\u{1F431}',
  },
  {
    title: 'Set your timer',
    desc: 'Tap the time pill to pick your focus duration. You can choose between Simple and Pomodoro mode in Settings.',
    icon: '\u23F1\uFE0F',
    highlight: 'timer',
  },
  {
    title: 'Play & Pause',
    desc: 'Hit the play button to start. While running, tap it again to pause \u2014 your time is saved exactly where you left off.',
    icon: '\u25B6\uFE0F',
    highlight: 'controls',
  },
  {
    title: 'Stop & Reset',
    desc: 'The stop button (square icon) appears while the timer is running. It resets your session back to the start.',
    icon: '\u23F9\uFE0F',
    highlight: 'controls',
  },
  {
    title: 'Focus Pal & Music',
    desc: 'Pick a cute companion and layer ambient sounds to create your perfect focus vibe.',
    icon: '\u{1F3B5}',
    highlight: 'palmusic',
  },
  {
    title: 'Session History',
    desc: 'Right-click the menu bar icon and select "History" to see all your completed sessions in a separate window.',
    icon: '\u{1F4CB}',
    highlight: 'topbar',
  },
  {
    title: 'Settings',
    desc: 'The gear icon opens settings where you can switch between Simple and Pomodoro timer modes.',
    icon: '\u2699\uFE0F',
    highlight: 'topbar',
  },
  {
    title: 'You\u2019re all set!',
    desc: 'Start a focus session and let meow keep you company. You got this!',
    icon: '\u{1F389}',
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end justify-center pb-3 px-3"
      style={{ background: 'rgba(0,0,0,0.75)', borderRadius: 'inherit' }}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="w-full p-4"
        style={{ background: '#2c2c2e', borderRadius: 16 }}
      >
        <div className="text-center mb-3">
          <span className="text-2xl">{current.icon}</span>
        </div>
        <h3 className="text-sm font-semibold text-white text-center mb-1">
          {current.title}
        </h3>
        <p className="text-xs text-text-secondary text-center leading-relaxed mb-4">
          {current.desc}
        </p>

        <div className="flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{
                  background: i === step ? '#818cf8' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="no-drag text-[11px] text-text-muted hover:text-text-secondary px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            {!isLast && step === 0 && (
              <button
                onClick={onComplete}
                className="no-drag text-[11px] text-text-muted hover:text-text-secondary px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Skip
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) onComplete();
                else setStep(step + 1);
              }}
              className="no-drag text-[11px] font-medium text-white px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: '#6366f1' }}
            >
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
