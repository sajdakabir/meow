'use client';
import { motion, AnimatePresence } from 'framer-motion';

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export default function Settings({ isOpen, onToggle, settings, onSettingsChange }) {
  const {
    workMinutes = 25,
    shortBreakMinutes = 5,
    longBreakMinutes = 15,
    autoStartBreaks = true,
    autoStartWork = false,
    showTimer = true,
    showPal = true,
  } = settings;

  const update = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
      {/* Settings toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="no-drag w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover/50 transition-all"
      >
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
          <SettingsIcon />
        </motion.div>
      </motion.button>

      {/* Settings panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-14 left-4 right-4 z-50 overflow-hidden"
          >
            <div className="bg-bg-secondary/95 backdrop-blur-xl rounded-2xl border border-border/30 p-5 shadow-2xl space-y-5 no-drag">
              <h3 className="text-sm font-semibold text-text-primary">Settings</h3>

              {/* Timer durations */}
              <div className="space-y-3">
                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Timer Durations</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'workMinutes', label: 'Focus', value: workMinutes },
                    { key: 'shortBreakMinutes', label: 'Short', value: shortBreakMinutes },
                    { key: 'longBreakMinutes', label: 'Long', value: longBreakMinutes },
                  ].map(({ key, label, value }) => (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <label className="text-[11px] text-text-secondary">{label}</label>
                      <div className="flex items-center gap-1 bg-bg-card rounded-lg px-2 py-1.5">
                        <button
                          onClick={() => update(key, Math.max(1, value - 5))}
                          className="text-text-muted hover:text-text-primary text-sm w-5 h-5 flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium text-text-primary w-8 text-center tabular-nums">
                          {value}
                        </span>
                        <button
                          onClick={() => update(key, Math.min(120, value + 5))}
                          className="text-text-muted hover:text-text-primary text-sm w-5 h-5 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-text-muted">min</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5">
                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Behavior</div>
                {[
                  { key: 'autoStartBreaks', label: 'Auto-start breaks', value: autoStartBreaks },
                  { key: 'autoStartWork', label: 'Auto-start work sessions', value: autoStartWork },
                  { key: 'showTimer', label: 'Show timer', value: showTimer },
                  { key: 'showPal', label: 'Show focus pal', value: showPal },
                ].map(({ key, label, value }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">{label}</span>
                    <button
                      onClick={() => update(key, !value)}
                      className={`w-9 h-5 rounded-full transition-all relative ${
                        value ? 'bg-accent' : 'bg-border'
                      }`}
                    >
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full bg-white absolute top-0.5"
                        animate={{ left: value ? '18px' : '3px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
