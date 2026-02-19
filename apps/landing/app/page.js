'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

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

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Pomodoro Timer',
    desc: 'Stay focused with customizable work sessions and breaks, right in your menu bar.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    title: 'Ambient Sounds',
    desc: 'Layer rain, forest, ocean, and more to create the perfect soundscape for deep work.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    title: 'Focus Pals',
    desc: 'Choose from adorable companions that keep you company while you work.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: 'Menu Bar Native',
    desc: 'Lives in your Mac\'s menu bar. Always one click away, never in your way.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Fully Private',
    desc: 'Runs entirely offline. No accounts, no tracking, no data leaves your Mac.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Lightweight',
    desc: 'Uses minimal resources. No Electron, no bloat — just a tiny native app.',
  },
];

const TESTIMONIALS = [
  { text: 'meow turned my chaotic work sessions into something I actually look forward to.', author: 'Sarah K.', role: 'Designer' },
  { text: 'The ambient sounds + timer combo is perfection. I\'ve never been this productive.', author: 'Alex M.', role: 'Developer' },
  { text: 'So simple, so beautiful. It just sits in my menu bar and does its job perfectly.', author: 'Jamie L.', role: 'Writer' },
];

const FAQS = [
  { q: 'Is meow really free?', a: 'Yes! meow is completely free and open source. No hidden fees, no subscriptions, no catch.' },
  { q: 'Can I contribute to the project?', a: 'Absolutely! meow is open source and we welcome contributions. Check out our GitHub repo to get started.' },
  { q: 'What Macs are supported?', a: 'meow works on macOS 12 (Monterey) and later, on both Intel and Apple Silicon Macs.' },
  { q: 'Can I hide the animal & timer?', a: 'Of course! You can toggle the focus pal and timer visibility anytime from the settings.' },
  { q: 'Does meow collect any data?', a: 'No. meow runs entirely offline on your machine. We don\'t collect any analytics or personal data whatsoever.' },
  { q: 'How can I give feedback or report a bug?', a: 'We\'d love to hear from you! Reach out via email or open an issue on our GitHub.' },
];

// ── Animated section wrapper ──
function FadeIn({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── FAQ Item ──
function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <FadeIn delay={index * 0.05}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 border-b border-gray-100 last:border-b-0 group"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-800 font-medium group-hover:text-indigo-500 transition-colors text-[15px]">{q}</span>
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-300 group-hover:text-indigo-400 text-xl shrink-0 transition-colors"
          >
            +
          </motion.div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-gray-500 text-sm leading-relaxed overflow-hidden pt-3"
            >
              {a}
            </motion.p>
          )}
        </AnimatePresence>
      </button>
    </FadeIn>
  );
}

// ── Notch / Dynamic Island ──
function Notch() {
  const [expanded, setExpanded] = useState(false);
  const notchRef = useRef(null);

  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

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

  const handleMouseLeave = () => {
    setExpanded(false);
    setShowSounds(false);
    setShowPalPicker(false);
  };

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
    <div
      className="absolute left-1/2 -translate-x-1/2 top-0 z-10"
      ref={notchRef}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.div
            key="collapsed"
            className="flex items-center gap-3 bg-black rounded-b-2xl px-4 py-1.5 cursor-pointer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-base">{pal.icon}</span>
            <span className="text-white text-sm font-medium tabular-nums">{display}</span>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            className="bg-[#1a1a1a] rounded-b-2xl overflow-hidden shadow-2xl shadow-black/50"
            style={{ width: 300 }}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
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
      <div className="flex justify-center mb-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="font-hand text-gray-400 text-lg flex items-center gap-1"
        >
          Try hovering on this!
          <span className="inline-block translate-y-1">↓</span>
        </motion.p>
      </div>

      <div className="rounded-2xl overflow-visible shadow-[0_20px_80px_-20px_rgba(0,0,0,0.2)] border border-black/8">
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
          <img
            src="/mountain.jpg"
            alt="Desktop wallpaper"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 h-7 bg-white/30 backdrop-blur-xl">
            <svg width="12" height="15" viewBox="0 0 170 200" fill="black" className="opacity-70">
              <path d="M150.4 68.2c-1.2.9-21.7 12.5-21.7 38.2 0 29.8 26.1 40.3 26.9 40.6-.1.6-4.2 14.4-13.8 28.5-8.6 12.4-17.5 24.7-31.2 24.7s-17.2-7.9-32.9-7.9c-15.4 0-20.8 8.2-33.3 8.2s-21.5-11.3-31.2-25C3.7 160.7 0 132.2 0 105.2c0-43.2 28.1-66.1 55.8-66.1 14.7 0 27 9.7 36.2 9.7 8.9 0 23-10.3 39.8-10.3 6.4 0 29.3.5 44.6 20.7zM113.1 32c6.3-7.7 10.7-18.3 10.7-29 0-1.5-.1-3-.4-4.2C113.2 0 100.7 8.3 93.7 17.3c-5.4 6.9-10.8 17.5-10.8 28.2 0 1.6.2 3.3.3 3.7.6.1 1.7.3 2.7.3 9.4 0 117.5-37.3 148.7-87.9z"/>
            </svg>
            <Notch />
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

// ── Feature Card ──
function FeatureCard({ icon, title, desc, index }) {
  return (
    <FadeIn delay={index * 0.08}>
      <div className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 transition-all duration-300">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-gray-900 font-semibold text-[15px] mb-1.5">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </FadeIn>
  );
}

// ── Testimonial Card ──
function TestimonialCard({ text, author, role, index }) {
  return (
    <FadeIn delay={index * 0.1}>
      <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col">
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <p className="text-gray-700 text-sm leading-relaxed flex-1">&ldquo;{text}&rdquo;</p>
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-gray-900 text-sm font-medium">{author}</p>
          <p className="text-gray-400 text-xs">{role}</p>
        </div>
      </div>
    </FadeIn>
  );
}

// ── Page ──
export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-gray-100/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img src="/image.png" alt="meow" className="h-7 w-7 rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-gray-900">meow</span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">Features</a>
            <a href="#faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">FAQ</a>
            <a
              href="#"
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 left-1/4 w-125 h-125 bg-indigo-100/40 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-100 h-100 bg-violet-100/30 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 pt-16 sm:pt-24 pb-8">
          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Free & open source for macOS
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-hand text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] text-gray-900"
            >
              Focus mode.{' '}
              <span className="bg-linear-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                Made delightful.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-gray-500 max-w-lg mx-auto leading-relaxed"
            >
              Transform your Mac&apos;s menu bar into a cozy focus space with
              ambient sounds and a companion by your side.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <a
                href="#"
                className="group inline-flex items-center gap-2.5 bg-gray-900 text-white font-medium px-7 py-3.5 rounded-full hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 transition-all text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-y-0.5 transition-transform">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download for Mac
              </a>
              <a
                href="https://github.com/sajdakabir/meow"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-gray-600 font-medium px-7 py-3.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-white transition-all text-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                </svg>
                Star on GitHub
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-xs text-gray-400"
            >
              Free & open source &middot; macOS 12+ &middot; Apple Silicon & Intel
            </motion.p>
          </div>
        </div>

        {/* Mac Screen */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto px-6 pb-24"
        >
          <MacScreen />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <FadeIn className="text-center mb-16">
            <span className="text-sm font-medium text-indigo-500 mb-3 block">Features</span>
            <h2 className="font-hand text-4xl sm:text-5xl text-gray-900">
              Everything you need to stay focused
            </h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto">
              A tiny but powerful set of tools designed to help you get into flow and stay there.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#fafafa] border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <FadeIn className="text-center mb-16">
            <span className="text-sm font-medium text-indigo-500 mb-3 block">Loved by many</span>
            <h2 className="font-hand text-4xl sm:text-5xl text-gray-900">
              What people are saying
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.author} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gray-900 via-gray-900 to-indigo-900 px-8 sm:px-16 py-16 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.1),transparent_50%)]" />
              <div className="relative">
                <h2 className="font-hand text-4xl sm:text-5xl text-white mb-4">
                  Ready to focus?
                </h2>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                  Download meow and turn your Mac into the coziest workspace you&apos;ve ever had.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2.5 bg-white text-gray-900 font-medium px-7 py-3.5 rounded-full hover:bg-gray-100 transition-colors text-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download for Mac
                  </a>
                  <a
                    href="https://github.com/sajdakabir/meow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-300 font-medium px-7 py-3.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-all text-sm"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                    </svg>
                    View on GitHub
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-[#fafafa] border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-24">
          <FadeIn className="text-center mb-12">
            <span className="text-sm font-medium text-indigo-500 mb-3 block">FAQ</span>
            <h2 className="font-hand text-4xl sm:text-5xl text-gray-900">
              Got questions?
            </h2>
          </FadeIn>

          <div className="bg-white rounded-2xl border border-gray-100 px-6 sm:px-8">
            {FAQS.map((faq, i) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/image.png" alt="meow" className="h-6 w-6 rounded-md" />
              <span className="text-lg font-bold tracking-tight text-gray-900">meow</span>
              <span className="text-gray-300">&middot;</span>
              <span className="text-sm text-gray-400">Focus mode for your Mac</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="https://x.com/sajdakabir" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">X</a>
              <a href="https://github.com/sajdakabir/meow" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">GitHub</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Made with Claude Code max plan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
