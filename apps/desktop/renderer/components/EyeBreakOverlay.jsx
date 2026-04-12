'use client';
import { motion, AnimatePresence } from 'framer-motion';

function EyeIcon({ className }) {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function EyeBreakOverlay({ isActive, breakTimeLeft, onDismiss, onSnooze, palIcon }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="eye-break-glow absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
            <div className="eye-break-glow-delayed absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }} />
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
            className="relative z-10 flex flex-col items-center text-center px-8"
          >
            {/* Pal icon with breathing animation */}
            <motion.div
              className="text-5xl mb-6"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {palIcon || '👀'}
            </motion.div>

            {/* Eye icon */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-4"
            >
              <EyeIcon className="text-accent-light" />
            </motion.div>

            <h2 className="text-2xl font-semibold text-white mb-2">
              Look away
            </h2>
            <p className="text-sm text-white/50 mb-8 max-w-xs">
              Focus on something 20 feet away to rest your eyes
            </p>

            {/* Countdown ring */}
            <div className="relative w-24 h-24 mb-8">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <motion.circle
                  cx="48" cy="48" r="42" fill="none"
                  stroke="url(#breakGradient)" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - breakTimeLeft / 20) }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-white tabular-nums">
                  {breakTimeLeft}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onDismiss}
                className="px-5 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Skip
              </button>
              <button
                onClick={() => onSnooze(5)}
                className="px-5 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                +5 min
              </button>
              <button
                onClick={() => onSnooze(15)}
                className="px-5 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                +15 min
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
