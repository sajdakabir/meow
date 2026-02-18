'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';

// ── SVG Animals ──
const PALS = [
  { id: 'cat', name: 'Luna', icon: '🐱', svg: (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="65" rx="25" ry="20" fill="#FFB366"/>
      <circle cx="60" cy="38" r="18" fill="#FFB366"/>
      <polygon points="45,24 42,8 53,20" fill="#FFB366"/><polygon points="75,24 78,8 67,20" fill="#FFB366"/>
      <polygon points="46,23 43,11 52,20" fill="#FF9999"/><polygon points="74,23 77,11 68,20" fill="#FF9999"/>
      <g className="blink">
        <ellipse cx="52" cy="36" rx="3" ry="3.5" fill="#2D2D2D"/>
        <ellipse cx="68" cy="36" rx="3" ry="3.5" fill="#2D2D2D"/>
        <circle cx="50.5" cy="34.5" r="1.2" fill="white"/><circle cx="66.5" cy="34.5" r="1.2" fill="white"/>
      </g>
      <ellipse cx="60" cy="42" rx="2" ry="1.5" fill="#FF8080"/>
      <path d="M57 44 Q60 47 63 44" fill="none" stroke="#CC6633" strokeWidth="0.8"/>
      <line x1="38" y1="40" x2="49" y2="41" stroke="#CC9966" strokeWidth="0.6"/>
      <line x1="71" y1="41" x2="82" y2="40" stroke="#CC9966" strokeWidth="0.6"/>
      <path d="M83 68 Q93 52 90 40" fill="none" stroke="#FFB366" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="48" cy="82" rx="7" ry="4" fill="#FFB366"/>
      <ellipse cx="72" cy="82" rx="7" ry="4" fill="#FFB366"/>
    </svg>
  )},
  { id: 'fox', name: 'Rusty', icon: '🦊', svg: (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="68" rx="24" ry="18" fill="#E87040"/>
      <ellipse cx="60" cy="72" rx="15" ry="12" fill="#FFF5E6"/>
      <circle cx="60" cy="38" r="18" fill="#E87040"/>
      <ellipse cx="60" cy="43" rx="12" ry="10" fill="#FFF5E6"/>
      <polygon points="44,24 38,4 54,18" fill="#E87040"/><polygon points="76,24 82,4 66,18" fill="#E87040"/>
      <polygon points="45,22 40,8 53,18" fill="#2D2D2D"/><polygon points="75,22 80,8 67,18" fill="#2D2D2D"/>
      <g className="blink">
        <ellipse cx="52" cy="36" rx="3" ry="3.5" fill="#2D2D2D"/><ellipse cx="68" cy="36" rx="3" ry="3.5" fill="#2D2D2D"/>
        <circle cx="50.5" cy="34.5" r="1" fill="white"/><circle cx="66.5" cy="34.5" r="1" fill="white"/>
      </g>
      <ellipse cx="60" cy="42" rx="2.5" ry="2" fill="#2D2D2D"/>
      <path d="M83 72 Q98 56 94 42" fill="none" stroke="#E87040" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="94" cy="42" r="3" fill="#FFF5E6"/>
    </svg>
  )},
  { id: 'owl', name: 'Hoot', icon: '🦉', svg: (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="62" rx="26" ry="28" fill="#8B6F47"/>
      <ellipse cx="60" cy="68" rx="17" ry="18" fill="#D4B896"/>
      <circle cx="60" cy="32" r="20" fill="#8B6F47"/>
      <polygon points="43,18 36,0 52,14" fill="#8B6F47"/><polygon points="77,18 84,0 68,14" fill="#8B6F47"/>
      <circle cx="50" cy="30" r="10" fill="#D4B896"/><circle cx="70" cy="30" r="10" fill="#D4B896"/>
      <g className="blink">
        <circle cx="50" cy="30" r="5" fill="#2D2D2D"/><circle cx="70" cy="30" r="5" fill="#2D2D2D"/>
        <circle cx="48.5" cy="28.5" r="2" fill="white"/><circle cx="68.5" cy="28.5" r="2" fill="white"/>
      </g>
      <polygon points="57,40 60,47 63,40" fill="#E8A020"/>
    </svg>
  )},
  { id: 'panda', name: 'Bamboo', icon: '🐼', svg: (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="68" rx="26" ry="20" fill="white"/>
      <circle cx="60" cy="38" r="20" fill="white"/>
      <circle cx="42" cy="18" r="8" fill="#2D2D2D"/><circle cx="78" cy="18" r="8" fill="#2D2D2D"/>
      <ellipse cx="50" cy="36" rx="8" ry="7" fill="#2D2D2D" transform="rotate(-10 50 36)"/>
      <ellipse cx="70" cy="36" rx="8" ry="7" fill="#2D2D2D" transform="rotate(10 70 36)"/>
      <g className="blink">
        <circle cx="50" cy="36" r="3.5" fill="white"/><circle cx="70" cy="36" r="3.5" fill="white"/>
        <circle cx="49" cy="35" r="1.8" fill="#2D2D2D"/><circle cx="69" cy="35" r="1.8" fill="#2D2D2D"/>
      </g>
      <ellipse cx="60" cy="44" rx="3" ry="2.5" fill="#2D2D2D"/>
      <ellipse cx="37" cy="65" rx="8" ry="6" fill="#2D2D2D" transform="rotate(-20 37 65)"/>
      <ellipse cx="83" cy="65" rx="8" ry="6" fill="#2D2D2D" transform="rotate(20 83 65)"/>
    </svg>
  )},
  { id: 'bunny', name: 'Clover', icon: '🐰', svg: (
    <svg viewBox="0 0 120 100" className="w-full h-full">
      <ellipse cx="60" cy="68" rx="22" ry="20" fill="#F0E0D0"/>
      <circle cx="60" cy="42" r="18" fill="#F0E0D0"/>
      <ellipse cx="49" cy="14" rx="5" ry="18" fill="#F0E0D0" transform="rotate(-10 49 14)"/>
      <ellipse cx="71" cy="14" rx="5" ry="18" fill="#F0E0D0" transform="rotate(10 71 14)"/>
      <ellipse cx="49" cy="14" rx="3" ry="14" fill="#FFB3B3" transform="rotate(-10 49 14)"/>
      <ellipse cx="71" cy="14" rx="3" ry="14" fill="#FFB3B3" transform="rotate(10 71 14)"/>
      <circle cx="45" cy="46" r="4" fill="#FFD4D4" opacity="0.5"/>
      <circle cx="75" cy="46" r="4" fill="#FFD4D4" opacity="0.5"/>
      <g className="blink">
        <circle cx="52" cy="40" rx="3" ry="3" fill="#2D2D2D"/><circle cx="68" cy="40" rx="3" ry="3" fill="#2D2D2D"/>
        <circle cx="51" cy="39" r="1" fill="white"/><circle cx="67" cy="39" r="1" fill="white"/>
      </g>
      <ellipse cx="60" cy="46" rx="2" ry="1.5" fill="#FF9999"/>
      <circle cx="80" cy="78" r="5" fill="#FFFFFF"/>
    </svg>
  )},
];

// ── Sound icon mapping ──
const SOUND_ICONS = {
  rain: '🌧', forest: '🌲', ocean: '🌊', fire: '🔥',
  cafe: '☕', wind: '💨', birds: '🐦', thunder: '⛈',
};

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('zen-focus-settings');
      if (saved) setSettings(JSON.parse(saved));
      const savedPal = localStorage.getItem('zen-focus-pal');
      if (savedPal) setSelectedPal(parseInt(savedPal, 10));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zen-focus-settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('zen-focus-pal', String(selectedPal));
    } catch {}
  }, [selectedPal]);

  const handleTimerComplete = useCallback((mode, sessions) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (mode === 'work') {
        window.electronAPI.showNotification('Focus complete! 🎉', `${sessions} session${sessions > 1 ? 's' : ''} done. Time for a break.`);
      } else {
        window.electronAPI.showNotification('Break over! ⚡', 'Ready to focus again?');
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
    const onSettings = (e) => setShowSettings(true);
    if (window.electronAPI.onOpenSettings) window.electronAPI.onOpenSettings(onSettings);
    return () => {
      window.electronAPI.removeAllListeners('tray-start-focus');
      window.electronAPI.removeAllListeners('tray-pause');
      window.electronAPI.removeAllListeners('tray-reset');
      window.electronAPI.removeAllListeners('open-settings');
    };
  }, [timer.start, timer.pause, timer.reset]);

  return (
    <div className="p-2 h-screen">
      {/* Main popover container */}
      <div className="bg-bg-primary rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl border border-white/[0.06]">

        {/* ── Top bar with settings gear ── */}
        <div className="flex items-center justify-end px-3 pt-2">
          <button
            onClick={() => { setShowSettings(!showSettings); setShowSounds(false); }}
            className="no-drag w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
        </div>

        {/* ── Timer row (Oak-style compact pill) ── */}
        <div className="px-4 pb-3">
          <div className="bg-bg-card rounded-2xl px-4 py-3 flex items-center gap-3">
            {/* Duration selector */}
            <button
              onClick={() => {
                const durations = [25, 30, 45, 60, 5, 10, 15];
                const current = Math.floor(timer.timeLeft / 60);
                const idx = durations.indexOf(current);
                const next = durations[(idx + 1) % durations.length];
                // Only change if not running
                if (!timer.isRunning) {
                  setSettings(s => ({ ...s, workMinutes: next }));
                  timer.setMode('work');
                }
              }}
              className="no-drag bg-bg-active/80 text-text-primary text-sm font-semibold px-3 py-1.5 rounded-xl min-w-[64px] text-center hover:bg-bg-hover transition-colors"
            >
              {Math.ceil(timer.timeLeft / 60)} min
            </button>

            {/* Timer display / task label */}
            <div className="flex-1 text-center">
              {timer.isRunning ? (
                <span className="text-text-primary text-lg font-medium tabular-nums tracking-wide">
                  {timer.display}
                </span>
              ) : (
                <span className="text-text-muted text-sm">
                  {isBreak ? (timer.mode === 'shortBreak' ? 'Short break' : 'Long break') : 'Ready to focus'}
                </span>
              )}
            </div>

            {/* Play / Pause button */}
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

          {/* ── Mode pills (when not running) ── */}
          {!timer.isRunning && (
            <div className="flex gap-1.5 mt-2 justify-center">
              {[
                { key: 'work', label: 'Focus' },
                { key: 'shortBreak', label: 'Short Break' },
                { key: 'longBreak', label: 'Long Break' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => timer.setMode(m.key)}
                  className={`no-drag text-[11px] px-2.5 py-1 rounded-lg transition-all ${
                    timer.mode === m.key
                      ? 'bg-bg-card text-text-primary font-medium'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Progress bar (when running) ── */}
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
        <div className="px-4 pb-3 flex gap-2">
          {/* Focus Pal button */}
          <button
            onClick={() => { setShowPalPicker(!showPalPicker); setShowSounds(false); setShowSettings(false); }}
            className="no-drag flex-1 bg-bg-card rounded-2xl px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors"
          >
            <span className="text-sm text-text-secondary font-medium">Focus Pal</span>
            <span className="text-lg ml-auto">{pal.icon}</span>
          </button>

          {/* Music button */}
          <button
            onClick={() => { setShowSounds(!showSounds); setShowPalPicker(false); setShowSettings(false); }}
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
          {/* Settings panel */}
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4"
            >
              <div className="bg-bg-card rounded-2xl p-4 mb-3 space-y-3">
                <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Timer Durations (minutes)</div>
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
                          className="no-drag text-text-muted hover:text-text-primary text-xs w-5">−</button>
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

          {/* Sounds panel */}
          {showSounds && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4"
            >
              <div className="bg-bg-card rounded-2xl p-3 mb-3">
                {/* Master volume */}
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

          {/* Pal picker panel */}
          {showPalPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-4"
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

        {/* ── Companion area (bottom, like Oak) ── */}
        <div className="flex-1 flex items-end justify-center pb-4 pt-2 relative overflow-hidden">
          {/* Ground line */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-card/30 to-transparent rounded-b-2xl"/>

          {/* Animated companion */}
          <motion.div
            className="relative z-10"
            style={{ width: 100, height: 85 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={isBreak ? 'sleepy' : timer.isRunning ? 'breathe' : 'walk'}>
              {pal.svg}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
