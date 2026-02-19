'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Data ──
const PALS = [
  { id: 'cat', name: 'Luna', icon: '🐱' },
  { id: 'fox', name: 'Rusty', icon: '🦊' },
  { id: 'owl', name: 'Hoot', icon: '🦉' },
  { id: 'panda', name: 'Bamboo', icon: '🐼' },
  { id: 'bunny', name: 'Clover', icon: '🐰' },
];

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: '🌧️' },
  { id: 'forest', name: 'Forest', icon: '🌲' },
  { id: 'ocean', name: 'Ocean', icon: '🌊' },
  { id: 'fire', name: 'Fire', icon: '🔥' },
  { id: 'cafe', name: 'Cafe', icon: '☕' },
  { id: 'wind', name: 'Wind', icon: '💨' },
  { id: 'birds', name: 'Birds', icon: '🐦' },
  { id: 'thunder', name: 'Thunder', icon: '⛈️' },
];

const MODES = ['work', 'shortBreak', 'longBreak'];
const MODE_DURATIONS = { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
const MODE_LABELS = { work: 'Task', shortBreak: 'Short Break', longBreak: 'Long Break' };

const FAQS = [
  { q: 'Can I try meow for free?', a: 'Yes! meow comes with a free trial so you can explore all features before committing.' },
  { q: 'Do I have to pay for updates?', a: 'Nope. All future updates are included with your purchase. Buy once, enjoy forever.' },
  { q: 'What Macs are supported?', a: 'meow works on macOS 12 (Monterey) and later, on both Intel and Apple Silicon Macs.' },
  { q: 'Can I hide the animal & timer?', a: 'Of course! You can toggle the focus pal and timer visibility anytime from the settings.' },
  { q: 'Does meow collect any data?', a: 'No. meow runs entirely offline on your machine. We don\'t collect any analytics or personal data whatsoever.' },
  { q: 'How can I give feedback or report a bug?', a: 'We\'d love to hear from you! Reach out via email or open an issue on our GitHub.' },
];

// ── FAQ Item ──
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left py-5 border-b border-gray-200 last:border-b-0 group"
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-900 font-medium group-hover:text-indigo-500 transition-colors">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-gray-400 text-xl flex-shrink-0 ml-4"
        >
          +
        </motion.span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-500 text-sm leading-relaxed overflow-hidden pt-2"
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Notch / Dynamic Island ──
function Notch() {
  const [expanded, setExpanded] = useState(false);
  const notchRef = useRef(null);

  // Timer state
  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Panels
  const [showSounds, setShowSounds] = useState(false);
  const [showPalPicker, setShowPalPicker] = useState(false);
  const [selectedPal, setSelectedPal] = useState(0);
  const [activeSounds, setActiveSounds] = useState({});

  const totalTime = MODE_DURATIONS[mode];
  const progress = 1 - timeLeft / totalTime;
  const isBreak = mode !== 'work';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const activeCount = Object.keys(activeSounds).length;
  const pal = PALS[selectedPal];

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { setIsRunning(false); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notchRef.current && !notchRef.current.contains(e.target)) {
        setExpanded(false);
        setShowSounds(false);
        setShowPalPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = () => {
    if (timeLeft === 0) setTimeLeft(totalTime);
    setIsRunning(!isRunning);
  };

  const cycleMode = () => {
    if (isRunning) return;
    const idx = MODES.indexOf(mode);
    const next = MODES[(idx + 1) % MODES.length];
    setMode(next);
    setTimeLeft(MODE_DURATIONS[next]);
  };

  const toggleSound = (id) => {
    setActiveSounds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10" ref={notchRef}>
      <AnimatePresence mode="wait">
        {!expanded ? (
          /* ── Collapsed notch pill ── */
          <motion.button
            key="collapsed"
            onClick={() => setExpanded(true)}
            className="flex items-center gap-3 bg-black rounded-b-2xl px-4 py-1.5 cursor-pointer hover:scale-[1.02] transition-transform"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-base">{pal.icon}</span>
            <span className="text-white text-sm font-medium tabular-nums">
              {display}
            </span>
          </motion.button>
        ) : (
          /* ── Expanded widget ── */
          <motion.div
            key="expanded"
            className="bg-[#1a1a1a] rounded-b-2xl overflow-hidden shadow-2xl shadow-black/50"
            style={{ width: 300 }}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Timer */}
            <div className="px-3 pt-3 pb-2">
              <div className="bg-[#2a2a2a] rounded-2xl px-4 py-3 flex items-center gap-3">
                <button
                  onClick={cycleMode}
                  className="bg-[#3a3a3a] hover:bg-[#444] text-white text-sm font-semibold px-3 py-1.5 rounded-xl min-w-16 text-center transition-colors"
                >
                  {Math.ceil(timeLeft / 60)} min
                </button>
                <div className="flex-1 text-center">
                  {isRunning ? (
                    <span className="text-white text-lg font-medium tabular-nums tracking-wide">{display}</span>
                  ) : (
                    <span className="text-[#a0a0a0] text-sm">{MODE_LABELS[mode]}</span>
                  )}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggle}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isRunning ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-0.5">
                      <path d="M8 5.14v14l11-7-11-7z" />
                    </svg>
                  )}
                </motion.button>
              </div>
              {isRunning && (
                <div className="mt-2 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: isBreak ? '#34d399' : '#6366f1' }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>

            {/* Pal + Music */}
            <div className="px-3 pb-3 flex gap-2">
              <button
                onClick={() => { setShowPalPicker(!showPalPicker); setShowSounds(false); }}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl px-4 py-2.5 flex items-center gap-2.5 transition-colors"
              >
                <span className="text-sm text-[#a0a0a0] font-medium">Focus Pal</span>
                <span className="text-lg ml-auto">{pal.icon}</span>
              </button>
              <button
                onClick={() => { setShowSounds(!showSounds); setShowPalPicker(false); }}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] rounded-2xl px-4 py-2.5 flex items-center gap-2.5 transition-colors"
              >
                <span className="text-sm text-[#a0a0a0] font-medium">Music</span>
                <span className={`text-[11px] font-bold ml-auto px-2 py-0.5 rounded-md ${
                  activeCount > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-[#3a3a3a] text-[#888]'
                }`}>
                  {activeCount > 0 ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Pal picker */}
            <AnimatePresence>
              {showPalPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden px-3"
                >
                  <div className="bg-[#2a2a2a] rounded-2xl p-3 mb-3">
                    <div className="flex gap-2 justify-center">
                      {PALS.map((p, i) => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedPal(i); setShowPalPicker(false); }}
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                            i === selectedPal
                              ? 'bg-indigo-500/20 ring-1 ring-indigo-400/40 scale-110'
                              : 'bg-[#1a1a1a]/60 hover:bg-[#333]'
                          }`}
                        >
                          {p.icon}
                        </button>
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
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden px-3"
                >
                  <div className="bg-[#2a2a2a] rounded-2xl p-3 mb-3">
                    <div className="grid grid-cols-4 gap-1.5">
                      {SOUNDS.map((s) => {
                        const active = !!activeSounds[s.id];
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleSound(s.id)}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all ${
                              active
                                ? 'bg-indigo-500/15 ring-1 ring-indigo-500/30'
                                : 'bg-[#1a1a1a]/60 hover:bg-[#333]'
                            }`}
                          >
                            <span className="text-base">{s.icon}</span>
                            <span className={`text-[9px] ${active ? 'text-indigo-300' : 'text-[#666]'}`}>{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mac Screen ──
function MacScreen() {
  return (
    <div>
      <div className="flex justify-center mb-3">
        <p className="font-hand text-gray-400 text-lg flex items-center gap-1">
          Try hovering on this!
          <span className="inline-block translate-y-1">↓</span>
        </p>
      </div>

      {/* Mac frame */}
      <div className="rounded-xl overflow-visible shadow-2xl shadow-black/15 border border-black/10">
        {/* Wallpaper + menu bar layered */}
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
          {/* Wallpaper fills entire screen */}
          <img
            src="/mountain.jpg"
            alt="Desktop wallpaper"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Translucent menu bar on top */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 h-7 bg-white/30 backdrop-blur-xl">
            {/* Apple icon */}
            <svg width="12" height="15" viewBox="0 0 170 200" fill="black" className="opacity-70">
              <path d="M150.4 68.2c-1.2.9-21.7 12.5-21.7 38.2 0 29.8 26.1 40.3 26.9 40.6-.1.6-4.2 14.4-13.8 28.5-8.6 12.4-17.5 24.7-31.2 24.7s-17.2-7.9-32.9-7.9c-15.4 0-20.8 8.2-33.3 8.2s-21.5-11.3-31.2-25C3.7 160.7 0 132.2 0 105.2c0-43.2 28.1-66.1 55.8-66.1 14.7 0 27 9.7 36.2 9.7 8.9 0 23-10.3 39.8-10.3 6.4 0 29.3.5 44.6 20.7zM113.1 32c6.3-7.7 10.7-18.3 10.7-29 0-1.5-.1-3-.4-4.2C113.2 0 100.7 8.3 93.7 17.3c-5.4 6.9-10.8 17.5-10.8 28.2 0 1.6.2 3.3.3 3.7.6.1 1.7.3 2.7.3 9.4 0 117.5-37.3 148.7-87.9z"/>
            </svg>

            {/* Notch */}
            <Notch />

            {/* Status icons */}
            <div className="flex items-center gap-2.5">
              <svg width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                <path d="M2 8.5a14 14 0 0120 0" />
                <path d="M5.5 12a9 9 0 0113 0" />
                <path d="M9 15.5a4 4 0 016 0" />
              </svg>
              <svg width="20" height="10" viewBox="0 0 30 14" fill="black" className="opacity-50">
                <rect x="0" y="1" width="25" height="12" rx="2.5" fill="none" stroke="black" strokeWidth="1.5" />
                <rect x="26" y="4.5" width="2.5" height="5" rx="1" opacity="0.4" />
                <rect x="2" y="3" width="16" height="8" rx="1.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="#" className="text-lg font-bold tracking-tight text-gray-900">meow</a>
        <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
      </nav>

      {/* Mac Screen */}
      <section className="max-w-3xl mx-auto px-6 pt-8 pb-12">
        <MacScreen />
      </section>

      {/* Headline & CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-hand text-6xl sm:text-7xl md:text-8xl leading-[1.05] text-gray-900"
        >
          Focus mode. Made delightful.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-lg text-gray-500 max-w-md mx-auto leading-relaxed"
        >
          Transform your Mac's menu bar into a focus space with calming music
          and a companion by your side.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-medium px-6 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download for Mac
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-white text-gray-900 font-medium px-6 py-3 rounded-full border border-gray-200 hover:border-gray-400 transition-colors text-sm"
          >
            Purchase $4.99
          </a>
        </motion.div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="font-hand text-4xl text-gray-900 mb-8">Questions</h2>
        <div>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-6 py-8 text-center">
        <p className="text-sm text-gray-400">Made with care &middot; meow</p>
      </footer>
    </div>
  );
}
