'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    target: '[data-tour="timer-pill"]',
    title: 'Timer',
    desc: 'Tap to pick your focus duration',
    position: 'below',
  },
  {
    target: '[data-tour="play-btn"]',
    title: 'Play / Pause',
    desc: 'Start or pause your session',
    position: 'below',
  },
  {
    target: '[data-tour="focus-pal"]',
    title: 'Focus Pal',
    desc: 'Pick a cute companion',
    position: 'below',
  },
  {
    target: '[data-tour="music-btn"]',
    title: 'Music',
    desc: 'Layer ambient sounds',
    position: 'below',
  },
  {
    target: '[data-tour="settings-btn"]',
    title: 'Settings',
    desc: 'Simple or Pomodoro mode',
    position: 'below',
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState(null);
  const tooltipRef = useRef(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  useEffect(() => {
    // Find the target element and get its position
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
        targetRect: rect,
      });
      // Add a highlight ring to the target
      el.style.outline = '2px solid #818cf8';
      el.style.outlineOffset = '2px';
      el.style.borderRadius = '12px';
      el.style.position = 'relative';
      el.style.zIndex = '60';
    }
    return () => {
      if (el) {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.zIndex = '';
      }
    };
  }, [step, current.target]);

  const goNext = () => {
    if (isLast) onComplete();
    else setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!pos) return null;

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={goNext}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 no-drag"
          style={{
            top: pos.top,
            left: Math.max(12, Math.min(pos.left - 100, 350 - 212)),
            width: 200,
          }}
        >
          {/* Arrow */}
          <div
            className="absolute -top-1.5 w-3 h-3 rotate-45"
            style={{
              background: '#2c2c2e',
              left: Math.min(Math.max(pos.left - Math.max(12, Math.min(pos.left - 100, 350 - 212)) - 6, 12), 180),
            }}
          />

          <div className="p-3 relative" style={{ background: '#2c2c2e', borderRadius: 12 }}>
            <p className="text-[11px] font-semibold text-white mb-0.5">{current.title}</p>
            <p className="text-[10px] text-text-secondary leading-relaxed mb-2.5">{current.desc}</p>

            <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-muted">{step + 1}/{STEPS.length}</span>
              <div className="flex gap-1.5">
                {step === 0 && (
                  <button
                    onClick={onComplete}
                    className="text-[10px] text-text-muted hover:text-text-secondary px-2 py-1 rounded cursor-pointer"
                  >
                    Skip
                  </button>
                )}
                {step > 0 && (
                  <button
                    onClick={goBack}
                    className="text-[10px] text-text-muted hover:text-text-secondary px-2 py-1 rounded cursor-pointer"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="text-[10px] font-medium text-white px-3 py-1 rounded cursor-pointer"
                  style={{ background: '#6366f1' }}
                >
                  {isLast ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
