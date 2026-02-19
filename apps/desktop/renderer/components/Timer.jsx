'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function Timer({ timer, showTimer = true }) {
  const { mode, modeLabel, display, isRunning, progress, completedSessions } = timer;

  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const modeColors = {
    work: { ring: '#6366f1', glow: 'rgba(99, 102, 241, 0.3)', bg: 'rgba(99, 102, 241, 0.08)' },
    shortBreak: { ring: '#34d399', glow: 'rgba(52, 211, 153, 0.3)', bg: 'rgba(52, 211, 153, 0.08)' },
    longBreak: { ring: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)', bg: 'rgba(251, 191, 36, 0.08)' },
  };

  const colors = modeColors[mode] || modeColors.work;

  if (!showTimer) return null;

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Mode selector pills */}
      <div className="flex gap-1.5 mb-6">
        {['work', 'shortBreak', 'longBreak'].map((m) => (
          <button
            key={m}
            onClick={() => timer.setMode(m)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 no-drag ${
              mode === m
                ? 'text-white shadow-lg'
                : 'text-text-secondary hover:text-text-primary bg-bg-card/50 hover:bg-bg-hover/50'
            }`}
            style={mode === m ? { backgroundColor: colors.ring, boxShadow: `0 0 20px ${colors.glow}` } : {}}
          >
            {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="relative" style={{ width: 260, height: 260 }}>
        <svg
          width="260"
          height="260"
          viewBox="0 0 260 260"
          className={isRunning ? 'timer-glow' : ''}
        >
          {/* Background ring */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          {/* Progress ring */}
          <motion.circle
            cx="130"
            cy="130"
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 130 130)"
            initial={false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
            style={{
              filter: `drop-shadow(0 0 8px ${colors.glow})`,
            }}
          />
          {/* Inner glow circle */}
          <circle
            cx="130"
            cy="130"
            r="95"
            fill={colors.bg}
            opacity={isRunning ? 0.5 : 0.2}
          />
        </svg>

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={modeLabel}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="text-xs font-medium uppercase tracking-widest mb-2"
              style={{ color: colors.ring }}
            >
              {modeLabel}
            </motion.div>
          </AnimatePresence>
          <motion.div
            className="text-5xl font-light tracking-tight text-text-primary tabular-nums"
            animate={{ opacity: isRunning ? 1 : [1, 0.5, 1] }}
            transition={
              isRunning
                ? { duration: 0.2 }
                : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            {display}
          </motion.div>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                i < completedSessions % 4 ? colors.ring : 'rgba(255,255,255,0.1)',
              boxShadow:
                i < completedSessions % 4 ? `0 0 8px ${colors.glow}` : 'none',
            }}
            animate={
              i < completedSessions % 4
                ? { scale: [1, 1.2, 1] }
                : {}
            }
            transition={{ duration: 0.3 }}
          />
        ))}
        {completedSessions > 0 && (
          <span className="text-xs text-text-muted ml-1">
            {completedSessions} done
          </span>
        )}
      </div>
    </motion.div>
  );
}
