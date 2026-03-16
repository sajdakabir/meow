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
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [selectedPal, setSelectedPal] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [pomodoroMode, setPomodoroMode] = useState(false);
  const [pomodoroSettings, setPomodoroSettings] = useState({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  });
  const containerRef = useRef(null);
  const isCollapsingRef = useRef(false);
  const lastHeightRef = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('meow-minutes');
      if (saved) setTimerMinutes(parseInt(saved, 10));
      const savedPal = localStorage.getItem('meow-pal');
      if (savedPal) setSelectedPal(parseInt(savedPal, 10));
      const savedPomo = localStorage.getItem('meow-pomodoro');
      if (savedPomo) setPomodoroMode(savedPomo === 'true');
      const savedPomoSettings = localStorage.getItem('meow-pomodoro-settings');
      if (savedPomoSettings) setPomodoroSettings(JSON.parse(savedPomoSettings));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('meow-minutes', String(timerMinutes)); } catch {}
  }, [timerMinutes]);

  useEffect(() => {
    try { localStorage.setItem('meow-pomodoro', String(pomodoroMode)); } catch {}
  }, [pomodoroMode]);

  useEffect(() => {
    try { localStorage.setItem('meow-pomodoro-settings', JSON.stringify(pomodoroSettings)); } catch {}
  }, [pomodoroSettings]);

  useEffect(() => {
    try { localStorage.setItem('meow-pal', String(selectedPal)); } catch {}
  }, [selectedPal]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const observer = new ResizeObserver((entries) => {
      if (isCollapsingRef.current) return;
      for (const entry of entries) {
        const height = Math.ceil(
          entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height
        ) + 4;
        // Only call resize if height actually changed (prevents feedback loop)
        if (Math.abs(height - lastHeightRef.current) > 1) {
          lastHeightRef.current = height;
          tauriBridge.resizeWindow(height);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const audioCtxRef = useRef(null);

  // Pre-warm AudioContext on first user interaction
  useEffect(() => {
    const warmUp = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    window.addEventListener('click', warmUp, { once: true });
    return () => window.removeEventListener('click', warmUp);
  }, []);

  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Three-note ascending chime: C5 → E5 → G5, played twice for emphasis
      const playOnce = (delay) => {
        [[523.25, 0], [659.25, 0.18], [783.99, 0.36]].forEach(([freq, when]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = freq;
          const t = ctx.currentTime + delay + when;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          osc.start(t);
          osc.stop(t + 0.95);
        });
      };
      playOnce(0);
      playOnce(0.7); // repeat for emphasis
    } catch {}
  }, []);

  const handleTimerComplete = useCallback((...args) => {
    playChime();
    if (pomodoroMode) {
      const [mode, sessions] = args;
      if (mode === 'work') {
        tauriBridge.showNotification('Focus complete!', `${sessions} session${sessions > 1 ? 's' : ''} done. Time for a break.`);
      } else {
        tauriBridge.showNotification('Break over!', 'Ready to focus again?');
      }
    } else {
      const sessions = args[0];
      tauriBridge.showNotification('Timer done!', `${sessions} session${sessions > 1 ? 's' : ''} completed.`);
    }
  }, [playChime, pomodoroMode]);

  const timer = useTimer({
    minutes: timerMinutes,
    pomodoroMode,
    ...pomodoroSettings,
    onComplete: handleTimerComplete,
  });
  const audio = useAudio();

  const activeCount = Object.keys(audio.activeSounds).length;
  const pal = PALS[selectedPal];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlisteners = [];

    const setup = async () => {
      unlisteners.push(await tauriBridge.onStartFocus(() => { timer.start(); setExpanded(true); }));
      unlisteners.push(await tauriBridge.onPause(() => timer.pause()));
      unlisteners.push(await tauriBridge.onReset(() => timer.reset()));
      unlisteners.push(await tauriBridge.on('open-about', () => {
        setExpanded(true);
        setShowAbout(true);
               setShowSounds(false);
        setShowPalPicker(false);
        setShowTimerPicker(false);
      }));
      // Rust → JS: expand or collapse the popover
      unlisteners.push(await tauriBridge.on('popover-expand', () => {
        isCollapsingRef.current = false;
        setExpanded(true);
      }));
      unlisteners.push(await tauriBridge.on('popover-collapse', () => {
        isCollapsingRef.current = true;
        setExpanded(false);
        setShowSettings(false);
        setShowSounds(false);
        setShowPalPicker(false);
        setShowTimerPicker(false);
        setShowAbout(false);
        setTimeout(() => { isCollapsingRef.current = false; }, 300);
      }));
    };
    setup();

    return () => {
      unlisteners.forEach((fn) => fn && fn());
    };
  }, [timer.start, timer.pause, timer.reset]);

  const timerDisplay = timer.isRunning ? timer.display : `${Math.ceil(timer.timeLeft / 60)}:00`;

  return (
    <div ref={containerRef} style={{ padding: expanded ? '6px 8px 8px' : '0', transition: 'padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <motion.div
        className="overflow-hidden flex flex-col"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          borderRadius: expanded ? '28px' : '14px',
        }}
        transition={{
          opacity: { duration: 0.15 },
          borderRadius: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
          layout: { type: 'spring', stiffness: 400, damping: 30 }
        }}
        style={{ background: '#000000' }}
        layout
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            /* ── Notch wings ── cat on left | notch gap | timer + controls on right */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="no-drag flex items-center justify-between"
              style={{ height: 32, paddingLeft: 10, paddingRight: 8 }}
            >
              {/* Left wing — cat icon */}
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center justify-center text-[15px] opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ width: 26, height: 26 }}
              >
                {pal.icon}
              </button>

              {/* Notch gap — transparent spacer for the physical notch */}
              <div style={{ width: 170, flexShrink: 0 }} />

              {/* Right wing — timer only */}
              <span className="text-[12px] font-semibold tabular-nums text-white/90">
                {timerDisplay}
              </span>
            </motion.div>
          ) : (
            /* ── Expanded card ── */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Settings & About */}
              <div className="flex items-center justify-end gap-1 px-4 pt-2.5">
                <button
                  onClick={() => { setShowAbout(!showAbout); setShowSettings(false); setShowSounds(false); setShowPalPicker(false); setShowTimerPicker(false); }}
                  className="no-drag w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                </button>
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowSounds(false); setShowPalPicker(false); setShowTimerPicker(false); setShowAbout(false); }}
                  className="no-drag w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
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
                  {/* Left pill: countdown while running, duration picker when idle */}
                  <button
                    onClick={() => {
                      if (!timer.isRunning) {
                        setShowTimerPicker(!showTimerPicker);
                                               setShowSounds(false);
                        setShowPalPicker(false);
                      }
                    }}
                    className="no-drag font-semibold px-3 py-1.5 min-w-16 text-center transition-colors cursor-pointer"
                    style={{ background: '#3a3a3c', borderRadius: 12, flexShrink: 0 }}
                  >
                    {timer.isRunning ? (
                      <span className="text-text-primary text-base tabular-nums tracking-wide">
                        {timer.display}
                      </span>
                    ) : (
                      <span className="text-text-primary text-sm hover:bg-bg-active">
                        {Math.ceil(timer.timeLeft / 60)} min
                      </span>
                    )}
                  </button>

                  {/* Center: task name or break label */}
                  <div className="flex-1 text-center min-w-0">
                    {timer.isRunning ? (
                      <span className="text-text-muted text-sm truncate block">
                        {taskName || timer.modeLabel || ''}
                      </span>
                    ) : pomodoroMode && timer.mode !== 'work' ? (
                      <span className="text-text-muted text-sm">{timer.modeLabel}</span>
                    ) : (
                      <input
                        type="text"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        placeholder="Task (optional)"
                        onMouseDown={() => tauriBridge.focusWindow()}
                        className="no-drag w-full bg-transparent text-center text-text-muted text-sm outline-none placeholder:text-text-muted"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={timer.toggle}
                      className="no-drag w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
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
                    {timer.isRunning && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={timer.reset}
                        className="no-drag w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
                          <rect x="5" y="5" width="14" height="14" rx="2"/>
                        </svg>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* Focus Pal + Music */}
              <div className="px-4 pb-3.5 flex gap-2.5">
                <button
                  onClick={() => { setShowPalPicker(!showPalPicker); setShowSounds(false); setShowSettings(false); setShowTimerPicker(false); setShowAbout(false); }}
                  className="no-drag flex-1 px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors cursor-pointer"
                  style={{ background: '#2c2c2e', borderRadius: 16 }}
                >
                  <span className="text-sm text-text-secondary font-medium">Focus Pal</span>
                  <span className="text-lg ml-auto">{pal.icon}</span>
                </button>

                <button
                  onClick={() => { setShowSounds(!showSounds); setShowPalPicker(false); setShowSettings(false); setShowTimerPicker(false); setShowAbout(false); }}
                  className="no-drag flex-1 px-4 py-2.5 flex items-center gap-2.5 hover:bg-bg-hover transition-colors cursor-pointer"
                  style={{ background: '#2c2c2e', borderRadius: 16 }}
                >
                  <span className="text-sm text-text-secondary font-medium">Music</span>
                  <span
                    onClick={(e) => {
                      if (activeCount > 0) {
                        e.stopPropagation();
                        audio.stopAll();
                      }
                    }}
                    className={`text-[11px] font-bold ml-auto px-2 py-0.5 rounded-md ${
                      activeCount > 0 ? 'bg-accent/20 text-accent-light cursor-pointer' : 'text-text-muted'
                    }`} style={activeCount > 0 ? {} : { background: '#3a3a3c' }}
                  >
                    {activeCount > 0 ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Expandable panels */}
              <AnimatePresence>
                {showTimerPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="p-3 mb-3" style={{ background: '#2c2c2e', borderRadius: 16 }}>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[5, 10, 15, 20, 25, 30, 45, 50, 60].map(min => (
                          <button
                            key={min}
                            onClick={() => {
                              setTimerMinutes(min);
                              timer.setDuration(min);
                              setShowTimerPicker(false);
                            }}
                            className={`no-drag py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                              timerMinutes === min
                                ? 'bg-white/20 text-white ring-1 ring-white/30'
                                : 'text-text-secondary hover:bg-white/10'
                            }`}
                            style={{ background: timerMinutes === min ? undefined : '#3a3a3c' }}
                          >
                            {min}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}


                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="p-4 mb-3 space-y-3" style={{ background: '#2c2c2e', borderRadius: 16 }}>
                      {/* Mode toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Timer Mode</span>
                        <div className="flex rounded-lg overflow-hidden" style={{ background: '#1c1c1e' }}>
                          <button
                            onClick={() => setPomodoroMode(false)}
                            className={`no-drag px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                              !pomodoroMode ? 'bg-white/15 text-white' : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            Simple
                          </button>
                          <button
                            onClick={() => setPomodoroMode(true)}
                            className={`no-drag px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                              pomodoroMode ? 'bg-white/15 text-white' : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            Pomodoro
                          </button>
                        </div>
                      </div>

                      {/* Pomodoro settings — only show when pomodoro mode is on */}
                      {pomodoroMode && (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: 'workMinutes', label: 'Focus' },
                              { key: 'shortBreakMinutes', label: 'Short Break' },
                              { key: 'longBreakMinutes', label: 'Long Break' },
                            ].map(s => (
                              <div key={s.key} className="text-center">
                                <div className="text-[10px] text-text-muted mb-1">{s.label}</div>
                                <div className="flex items-center justify-center gap-1 px-2 py-1" style={{ background: '#1c1c1e', borderRadius: 10 }}>
                                  <button onClick={() => setPomodoroSettings(p => ({...p, [s.key]: Math.max(1, p[s.key] - 5)}))}
                                    className="no-drag text-text-muted hover:text-text-primary text-xs w-5 cursor-pointer">{'\u2212'}</button>
                                  <span className="text-sm font-medium text-text-primary w-6 text-center">{pomodoroSettings[s.key]}</span>
                                  <button onClick={() => setPomodoroSettings(p => ({...p, [s.key]: Math.min(120, p[s.key] + 5)}))}
                                    className="no-drag text-text-muted hover:text-text-primary text-xs w-5 cursor-pointer">+</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                                className={`no-drag w-full aspect-square flex flex-col items-center justify-center gap-0.5 transition-all text-center cursor-pointer ${
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
                            className={`no-drag w-11 h-11 flex items-center justify-center text-xl transition-all cursor-pointer ${
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

                {showAbout && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden px-4"
                  >
                    <div className="p-4 mb-3 text-center" style={{ background: '#2c2c2e', borderRadius: 16 }}>
                      <div className="text-2xl mb-1">{pal.icon}</div>
                      <div className="text-sm font-semibold text-white">meow</div>
                      <div className="text-[11px] text-text-muted mt-0.5">v1.0.0</div>
                      <p className="text-[11px] text-text-muted mt-2 leading-relaxed">
                        Focus mode. Made delightful.<br />
                        Ambient sounds, a timer, and an adorable companion — tucked into your menu bar.
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-3">
                        <button
                          onClick={() => { tauriBridge.openUrl('https://github.com/sajdakabir/meow'); tauriBridge.close(); }}
                          className="no-drag text-[11px] text-accent-light hover:underline cursor-pointer bg-transparent border-none"
                        >
                          GitHub
                        </button>
                        <span className="text-text-muted text-[10px]">·</span>
                        <button
                          onClick={() => { tauriBridge.openUrl('https://github.com/sajdakabir/meow/releases/latest'); tauriBridge.close(); }}
                          className="no-drag text-[11px] text-accent-light hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Releases
                        </button>
                        <span className="text-text-muted text-[10px]">·</span>
                        <button
                          onClick={() => { tauriBridge.openUrl('https://github.com/sajdakabir/meow/issues'); tauriBridge.close(); }}
                          className="no-drag text-[11px] text-accent-light hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Report a Bug
                        </button>
                        <span className="text-text-muted text-[10px]">·</span>
                        <button
                          onClick={() => { tauriBridge.openUrl('https://buymeacoffee.com/sajdakabir'); tauriBridge.close(); }}
                          className="no-drag text-[11px] text-accent-light hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Support
                        </button>
                      </div>
                      <div className="text-[10px] text-text-muted mt-3">
                        Made with care by sajdakabir
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
