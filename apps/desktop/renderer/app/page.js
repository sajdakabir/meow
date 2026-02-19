'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import { tauriBridge } from '../lib/tauri-bridge';

// ── Focus Pals ──
const PALS = [
  { id: 'cat', name: 'Luna', icon: '\u{1F431}' },
  { id: 'fox', name: 'Rusty', icon: '\u{1F98A}' },
  { id: 'owl', name: 'Hoot', icon: '\u{1F989}' },
  { id: 'panda', name: 'Bamboo', icon: '\u{1F43C}' },
  { id: 'bunny', name: 'Clover', icon: '\u{1F430}' },
];

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSounds, setShowSounds] = useState(false);
  const [showPalPicker, setShowPalPicker] = useState(false);
  const [selectedPal, setSelectedPal] = useState(0);
  const [settings, setSettings] = useState({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoStartBreaks: true,
    autoStartWork: false,
  });
  const containerRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('zen-focus-settings');
      if (saved) setSettings(JSON.parse(saved));
      const savedPal = localStorage.getItem('zen-focus-pal');
      if (savedPal) setSelectedPal(parseInt(savedPal, 10));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('zen-focus-settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    try { localStorage.setItem('zen-focus-pal', String(selectedPal)); } catch {}
  }, [selectedPal]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.ceil(
          entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height
        ) + 16;
        tauriBridge.resizeWindow(height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleTimerComplete = useCallback((mode, sessions) => {
    if (mode === 'work') {
      tauriBridge.showNotification(
        'Focus complete!',
        `${sessions} session${sessions > 1 ? 's' : ''} done. Time for a break.`
      );
    } else {
      tauriBridge.showNotification('Break over!', 'Ready to focus again?');
    }
  }, []);

  const timer = useTimer({ ...settings, onComplete: handleTimerComplete });
  const audio = useAudio();

  const activeCount = Object.keys(audio.activeSounds).length;
  const pal = PALS[selectedPal];
  const isBreak = timer.mode !== 'work';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlisteners = [];

    const setup = async () => {
      unlisteners.push(await tauriBridge.onStartFocus(() => { timer.start(); setExpanded(true); }));
      unlisteners.push(await tauriBridge.onPause(() => timer.pause()));
      unlisteners.push(await tauriBridge.onReset(() => timer.reset()));
      unlisteners.push(await tauriBridge.onOpenSettings(() => {
        setExpanded(true);
        setShowSettings(true);
        setShowSounds(false);
        setShowPalPicker(false);
      }));
    };
    setup();

    return () => {
      unlisteners.forEach((fn) => fn && fn());
    };
  }, [timer.start, timer.pause, timer.reset]);

  const collapse = () => {
    setExpanded(false);
    setShowSettings(false);
    setShowSounds(false);
    setShowPalPicker(false);
  };

  const timerDisplay = timer.isRunning ? timer.display : `${Math.ceil(timer.timeLeft / 60)}:00`;

  return (
    <div className="px-2 pb-2 pt-1" ref={containerRef}>
      <motion.div
        className="overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 0.96, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        style={{
          background: '#1c1c1e',
          borderRadius: expanded ? 22 : 14,
        }}
        layout
        layoutTransition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            /* ── Collapsed pill ── */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="no-drag flex items-center px-3 py-2 gap-2"
            >
              <div
                className="flex items-center gap-2.5 flex-1 cursor-pointer px-1.5"
                onClick={() => setExpanded(true)}
              >
                <span className="text-lg">{pal.icon}</span>
                <span className="text-[13px] text-text-primary font-semibold tabular-nums">
                  {timerDisplay}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {timer.isRunning ? (
                  <>
                    <button
                      onClick={timer.pause}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    </button>
                    <button
                      onClick={timer.reset}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={timer.start}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                      <path d="M8 5.14v14l11-7-11-7z"/>
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            /* ── Expanded card ── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Collapse chevron + Settings gear */}
              <div className="flex items-center justify-between px-4 pt-2.5">
                <button
                  onClick={collapse}
                  className="no-drag w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowSounds(false); setShowPalPicker(false); }}
                  className="no-drag w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>

              {/* Timer row */}
              <div className="px-4 pb-2.5">
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: '#2c2c2e', borderRadius: 16 }}
                >
                  <button
                    onClick={() => {
                      if (!timer.isRunning) {
                        const modes = ['work', 'shortBreak', 'longBreak'];
                        const idx = modes.indexOf(timer.mode);
                        timer.setMode(modes[(idx + 1) % modes.length]);
                      }
                    }}
                    className="no-drag text-text-primary text-sm font-semibold px-3 py-1.5 min-w-[64px] text-center hover:bg-bg-active transition-colors"
                    style={{ background: '#3a3a3c', borderRadius: 12 }}
                  >
                    {Math.ceil(timer.timeLeft / 60)} min
                  </button>

                  <div className="flex-1 text-center">
                    {timer.isRunning ? (
                      <span className="text-text-primary text-lg font-medium tabular-nums tracking-wide">
                        {timer.display}
                      </span>
                    ) : (
                      <span className="text-text-muted text-sm">
                        {timer.mode === 'work'
                          ? 'Task (optional)'
                          : timer.mode === 'shortBreak'
                          ? 'Short Break'
                          : 'Long Break'}
                      </span>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={timer.toggle}
                    className="no-drag w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    {timer.isRunning ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary ml-0.5">
                        <path d="M8 5.14v14l11-7-11-7z"/>
                      </svg>
                    )}
                  </motion.button>
                </div>

                {timer.isRunning && (
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#2c2c2e' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: isBreak ? '#34d399' : '#6366f1' }}
                      animate={{ width: `${timer.progress * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>

              {/* Focus Pal + Music */}
              <div className="px-4 pb-3.5 flex gap-2.5">
                <button
                  onClick={() => { setShowPalPicker(!showPalPicker); setShowSounds(false); setShowSettings(false); }}
                  className="no-drag flex-1 px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors"
                  style={{ background: '#2c2c2e', borderRadius: 16 }}
                >
                  <span className="text-sm text-text-secondary font-medium">Focus Pal</span>
                  <span className="text-lg ml-auto">{pal.icon}</span>
                </button>

                <button
                  onClick={() => { setShowSounds(!showSounds); setShowPalPicker(false); setShowSettings(false); }}
                  className="no-drag flex-1 px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors"
                  style={{ background: '#2c2c2e', borderRadius: 16 }}
                >
                  <span className="text-sm text-text-secondary font-medium">Music</span>
                  <span className={`text-[11px] font-bold ml-auto px-2 py-0.5 rounded-md ${
                    activeCount > 0 ? 'bg-accent/20 text-accent-light' : 'text-text-muted'
                  }`} style={activeCount > 0 ? {} : { background: '#3a3a3c' }}>
                    {activeCount > 0 ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Expandable panels */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="p-4 mb-3 space-y-3" style={{ background: '#2c2c2e', borderRadius: 16 }}>
                      <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Timer Settings</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'workMinutes', label: 'Focus', val: settings.workMinutes },
                          { key: 'shortBreakMinutes', label: 'Short', val: settings.shortBreakMinutes },
                          { key: 'longBreakMinutes', label: 'Long', val: settings.longBreakMinutes },
                        ].map(s => (
                          <div key={s.key} className="text-center">
                            <div className="text-[10px] text-text-muted mb-1">{s.label}</div>
                            <div className="flex items-center justify-center gap-1 px-2 py-1" style={{ background: '#1c1c1e', borderRadius: 10 }}>
                              <button onClick={() => setSettings(p => ({...p, [s.key]: Math.max(1, p[s.key] - 5)}))}
                                className="no-drag text-text-muted hover:text-text-primary text-xs w-5">{'\u2212'}</button>
                              <span className="text-sm font-medium text-text-primary w-6 text-center">{s.val}</span>
                              <button onClick={() => setSettings(p => ({...p, [s.key]: Math.min(120, p[s.key] + 5)}))}
                                className="no-drag text-text-muted hover:text-text-primary text-xs w-5">+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-1">
                        {[
                          { key: 'autoStartBreaks', label: 'Auto-start breaks', val: settings.autoStartBreaks },
                          { key: 'autoStartWork', label: 'Auto-start focus', val: settings.autoStartWork },
                        ].map(s => (
                          <div key={s.key} className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">{s.label}</span>
                            <button onClick={() => setSettings(p => ({...p, [s.key]: !p[s.key]}))}
                              className={`no-drag w-8 h-[18px] rounded-full relative transition-colors ${s.val ? 'bg-accent' : 'bg-border'}`}>
                              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all ${s.val ? 'left-[16px]' : 'left-[2px]'}`}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {showSounds && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="p-3 mb-3" style={{ background: '#2c2c2e', borderRadius: 16 }}>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <input type="range" min="0" max="1" step="0.01" value={audio.masterVolume}
                          onChange={(e) => audio.setMasterVolume(parseFloat(e.target.value))}
                          className="no-drag flex-1"/>
                        <span className="text-[10px] text-text-muted w-7 text-right">{Math.round(audio.masterVolume * 100)}%</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {audio.sounds.map(s => {
                          const active = !!audio.activeSounds[s.id];
                          return (
                            <div key={s.id} className="flex flex-col items-center">
                              <button
                                onClick={() => audio.toggleSound(s.id)}
                                className={`no-drag w-full aspect-square flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                                  active ? 'bg-accent/15 ring-1 ring-accent/30' : 'hover:bg-bg-hover'
                                }`}
                                style={{ borderRadius: 12, background: active ? undefined : '#1c1c1e' }}
                              >
                                <span className="text-base">{s.icon}</span>
                                <span className={`text-[9px] ${active ? 'text-accent-light' : 'text-text-muted'}`}>{s.name}</span>
                              </button>
                              {active && (
                                <input type="range" min="0" max="1" step="0.01"
                                  value={audio.volumes[s.id] || 0.5}
                                  onChange={(e) => audio.setSoundVolume(s.id, parseFloat(e.target.value))}
                                  className="no-drag w-full mt-1" style={{ height: '8px' }}/>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {showPalPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="p-3 mb-3" style={{ background: '#2c2c2e', borderRadius: 16 }}>
                      <div className="flex gap-2 justify-center">
                        {PALS.map((p, i) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPal(i); setShowPalPicker(false); }}
                            className={`no-drag w-11 h-11 flex items-center justify-center text-xl transition-all ${
                              i === selectedPal ? 'bg-accent/20 ring-1 ring-accent/40 scale-110' : 'hover:bg-bg-hover'
                            }`}
                            style={{ borderRadius: 12, background: i === selectedPal ? undefined : '#1c1c1e' }}
                          >
                            {p.icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
