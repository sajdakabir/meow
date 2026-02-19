'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';

// ── Focus Pals ──
const PALS = [
  { id: 'cat', name: 'Luna', icon: '\u{1F431}' },
  { id: 'fox', name: 'Rusty', icon: '\u{1F98A}' },
  { id: 'owl', name: 'Hoot', icon: '\u{1F989}' },
  { id: 'panda', name: 'Bamboo', icon: '\u{1F43C}' },
  { id: 'bunny', name: 'Clover', icon: '\u{1F430}' },
];

export default function Home() {
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

  // Load persisted settings
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

  // Dynamic window resize
  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;
    const api = window.electronAPI;
    if (!api?.resizeWindow) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.ceil(
          entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height
        ) + 16;
        api.resizeWindow(height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleTimerComplete = useCallback((mode, sessions) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (mode === 'work') {
        window.electronAPI.showNotification(
          'Focus complete!',
          `${sessions} session${sessions > 1 ? 's' : ''} done. Time for a break.`
        );
      } else {
        window.electronAPI.showNotification('Break over!', 'Ready to focus again?');
      }
    }
  }, []);

  const timer = useTimer({ ...settings, onComplete: handleTimerComplete });
  const audio = useAudio();

  const activeCount = Object.keys(audio.activeSounds).length;
  const pal = PALS[selectedPal];
  const isBreak = timer.mode !== 'work';

  // Listen for tray commands
  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;
    window.electronAPI.onStartFocus(() => timer.start());
    window.electronAPI.onPause(() => timer.pause());
    window.electronAPI.onReset(() => timer.reset());
    window.electronAPI.onOpenSettings(() => {
      setShowSettings(true);
      setShowSounds(false);
      setShowPalPicker(false);
    });
    return () => {
      window.electronAPI.removeAllListeners('tray-start-focus');
      window.electronAPI.removeAllListeners('tray-pause');
      window.electronAPI.removeAllListeners('tray-reset');
      window.electronAPI.removeAllListeners('open-settings');
    };
  }, [timer.start, timer.pause, timer.reset]);

  return (
    <div className="p-2" ref={containerRef}>
      <div className="bg-bg-primary rounded-2xl overflow-hidden flex flex-col border border-white/[0.06]">

        {/* ── Settings gear (top-right) ── */}
        <div className="flex items-center justify-end px-3 pt-2">
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

        {/* ── Timer row (compact pill) ── */}
        <div className="px-3 pb-2">
          <div className="bg-bg-card rounded-2xl px-4 py-3 flex items-center gap-3">
            {/* Duration / mode button */}
            <button
              onClick={() => {
                if (!timer.isRunning) {
                  const modes = ['work', 'shortBreak', 'longBreak'];
                  const idx = modes.indexOf(timer.mode);
                  timer.setMode(modes[(idx + 1) % modes.length]);
                }
              }}
              className="no-drag bg-bg-active/80 text-text-primary text-sm font-semibold px-3 py-1.5 rounded-xl min-w-[64px] text-center hover:bg-bg-hover transition-colors"
            >
              {Math.ceil(timer.timeLeft / 60)} min
            </button>

            {/* Center: task label or countdown */}
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

            {/* Play / Pause */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={timer.toggle}
              className="no-drag w-9 h-9 rounded-full flex items-center justify-center bg-text-primary/10 hover:bg-text-primary/20 transition-colors"
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

          {/* Progress bar (when running) */}
          {timer.isRunning && (
            <div className="mt-2 h-1 bg-bg-card rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: isBreak ? '#34d399' : '#6366f1' }}
                animate={{ width: `${timer.progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </div>

        {/* ── Focus Pal + Music row ── */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={() => {
              setShowPalPicker(!showPalPicker);
              setShowSounds(false);
              setShowSettings(false);
            }}
            className="no-drag flex-1 bg-bg-card rounded-2xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors"
          >
            <span className="text-sm text-text-secondary font-medium">Focus Pal</span>
            <span className="text-lg ml-auto">{pal.icon}</span>
          </button>

          <button
            onClick={() => {
              setShowSounds(!showSounds);
              setShowPalPicker(false);
              setShowSettings(false);
            }}
            className="no-drag flex-1 bg-bg-card rounded-2xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors"
          >
            <span className="text-sm text-text-secondary font-medium">Music</span>
            <span className={`text-[11px] font-bold ml-auto px-2 py-0.5 rounded-md ${
              activeCount > 0 ? 'bg-accent/20 text-accent-light' : 'bg-bg-active text-text-muted'
            }`}>
              {activeCount > 0 ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* ── Expandable panels ── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-3"
            >
              <div className="bg-bg-card rounded-2xl p-4 mb-3 space-y-3">
                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Timer Settings</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'workMinutes', label: 'Focus', val: settings.workMinutes },
                    { key: 'shortBreakMinutes', label: 'Short', val: settings.shortBreakMinutes },
                    { key: 'longBreakMinutes', label: 'Long', val: settings.longBreakMinutes },
                  ].map(s => (
                    <div key={s.key} className="text-center">
                      <div className="text-[10px] text-text-muted mb-1">{s.label}</div>
                      <div className="flex items-center justify-center gap-1 bg-bg-primary rounded-lg px-2 py-1">
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
              className="overflow-hidden px-3"
            >
              <div className="bg-bg-card rounded-2xl p-3 mb-3">
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
                          className={`no-drag w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                            active ? 'bg-accent/15 ring-1 ring-accent/30' : 'bg-bg-primary/60 hover:bg-bg-hover'
                          }`}
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
              className="overflow-hidden px-3"
            >
              <div className="bg-bg-card rounded-2xl p-3 mb-3">
                <div className="flex gap-2 justify-center">
                  {PALS.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPal(i); setShowPalPicker(false); }}
                      className={`no-drag w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                        i === selectedPal ? 'bg-accent/20 ring-1 ring-accent/40 scale-110' : 'bg-bg-primary/60 hover:bg-bg-hover'
                      }`}
                    >
                      {p.icon}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
