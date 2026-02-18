'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SoundWave({ active }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 rounded-full"
          style={{ backgroundColor: active ? '#6366f1' : '#475569' }}
          animate={
            active
              ? {
                  height: ['4px', `${10 + Math.random() * 8}px`, '4px'],
                }
              : { height: '4px' }
          }
          transition={
            active
              ? {
                  duration: 0.6 + i * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

function VolumeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export default function AmbientSounds({ audio }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { sounds, activeSounds, volumes, masterVolume, toggleSound, setSoundVolume, setMasterVolume } = audio;

  const activeCount = Object.keys(activeSounds).length;

  return (
    <div className="no-drag">
      {/* Toggle button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-bg-card/40 hover:bg-bg-card/60 transition-all"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg">🎵</div>
          <div className="text-left">
            <div className="text-sm font-medium text-text-primary">Ambient Sounds</div>
            <div className="text-xs text-text-muted">
              {activeCount > 0 ? `${activeCount} sound${activeCount > 1 ? 's' : ''} playing` : 'Tap to add sounds'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && <SoundWave active={true} />}
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-text-muted"
            animate={{ rotate: isExpanded ? 180 : 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </div>
      </motion.button>

      {/* Sound grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 px-1 space-y-3">
              {/* Master volume */}
              <div className="flex items-center gap-3 px-3 pb-2 border-b border-border/30">
                <VolumeIcon />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1"
                />
                <span className="text-xs text-text-muted w-8 text-right">
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>

              {/* Sound grid */}
              <div className="grid grid-cols-4 gap-2">
                {sounds.map((sound) => {
                  const isActive = !!activeSounds[sound.id];
                  return (
                    <div key={sound.id} className="flex flex-col items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSound(sound.id)}
                        className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          isActive
                            ? 'bg-accent/20 ring-1 ring-accent/50 shadow-lg'
                            : 'bg-bg-card/50 hover:bg-bg-hover/50'
                        }`}
                        style={
                          isActive
                            ? { boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)' }
                            : {}
                        }
                      >
                        <span className="text-xl">{sound.icon}</span>
                        <span className={`text-[10px] font-medium ${isActive ? 'text-accent-light' : 'text-text-muted'}`}>
                          {sound.name}
                        </span>
                      </motion.button>
                      {/* Individual volume */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="w-full px-1"
                        >
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volumes[sound.id] || 0.5}
                            onChange={(e) => setSoundVolume(sound.id, parseFloat(e.target.value))}
                            className="w-full h-0.5"
                          />
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
