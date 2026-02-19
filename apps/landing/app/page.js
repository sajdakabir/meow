'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── FAQ Data ──
const FAQS = [
  {
    q: 'Can I try meow for free?',
    a: 'Yes! meow comes with a free trial so you can explore all features before committing.',
  },
  {
    q: 'Do I have to pay for updates?',
    a: 'Nope. All future updates are included with your purchase. Buy once, enjoy forever.',
  },
  {
    q: 'What Macs are supported?',
    a: 'meow works on macOS 12 (Monterey) and later, on both Intel and Apple Silicon Macs.',
  },
  {
    q: 'Can I hide the animal & timer?',
    a: 'Of course! You can toggle the focus pal and timer visibility anytime from the settings.',
  },
  {
    q: 'Does meow collect any data?',
    a: 'No. meow runs entirely offline on your machine. We don\'t collect any analytics or personal data whatsoever.',
  },
  {
    q: 'How can I give feedback or report a bug?',
    a: 'We\'d love to hear from you! Reach out via email or open an issue on our GitHub.',
  },
];

// ── FAQ Item ──
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left py-5 border-b border-border last:border-b-0 group"
    >
      <div className="flex items-center justify-between">
        <span className="text-text font-medium group-hover:text-accent transition-colors">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-text-muted text-xl flex-shrink-0 ml-4"
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
            className="text-text-secondary text-sm leading-relaxed overflow-hidden pt-2"
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Mac Screen with App Widget ──
function MacScreen() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative group">
      {/* "Try hovering on this!" label */}
      <div className="flex justify-center mb-3">
        <p className="font-hand text-text-muted text-lg flex items-center gap-1">
          Try hovering on this!
          <span className="inline-block translate-y-1">↓</span>
        </p>
      </div>

      <motion.div
        className="relative cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* Mac screen frame */}
        <div className="rounded-xl overflow-hidden border border-black/10 shadow-2xl shadow-black/15">
          {/* Menu bar */}
          <div className="relative bg-[#e8e5df]/90 backdrop-blur-sm flex items-center justify-between px-4 py-1.5 text-[11px] text-black/70">
            {/* Left - Apple icon */}
            <div className="flex items-center gap-3">
              <svg width="13" height="16" viewBox="0 0 814 1000" fill="currentColor" className="opacity-80">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8-62.2 0-106.9-56.3-155.5-124.7C46.7 710.4 0 googletag.pubads() 524.9 0 389.3c0-174.1 113.2-265.7 223.1-265.7 68 0 124.7 44.8 165.9 44.8 39.5 0 101.1-47.4 177.4-47.4 28.3 0 130 2.5 197.7 97.9zM554.1 159.4c31.4-38.2 53.4-91.3 53.4-144.4 0-7.4-.6-14.8-1.9-20.8C548.8 0 480.2 41.5 445.6 86.3c-27 34.5-55.6 87.5-55.6 141.2 0 8.1 1.3 16.1 1.9 18.6 3.2.6 8.4 1.3 13.5 1.3 53.4 0 117.5-37.3 148.7-87.9z"/>
              </svg>
            </div>

            {/* Center - notch area (where our app lives) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0">
              {/* App popover widget */}
              <motion.div
                animate={{ y: hovered ? 0 : -2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="bg-[#1a1a1a] rounded-b-2xl overflow-hidden shadow-xl shadow-black/30 min-w-[280px]">
                  {/* Timer row */}
                  <div className="p-2.5">
                    <div className="bg-[#2a2a2a] rounded-xl px-3 py-2 flex items-center gap-2.5">
                      <div className="bg-[#3a3a3a] text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                        25 min
                      </div>
                      <div className="flex-1 text-center text-[#a0a0a0] text-xs">
                        Task
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-0.5">
                          <path d="M8 5.14v14l11-7-11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Pal + Music row */}
                  <div className="px-2.5 pb-2.5 flex gap-1.5">
                    <div className="flex-1 bg-[#2a2a2a] rounded-xl px-3 py-2 flex items-center gap-2">
                      <span className="text-xs text-[#a0a0a0] font-medium">Focus Pal</span>
                      <motion.span
                        className="text-sm ml-auto"
                        animate={hovered ? { rotate: [0, -15, 15, -15, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        🐍
                      </motion.span>
                    </div>
                    <div className="flex-1 bg-[#2a2a2a] rounded-xl px-3 py-2 flex items-center gap-2">
                      <span className="text-xs text-[#a0a0a0] font-medium">Music</span>
                      <span className="text-[10px] font-bold ml-auto px-1.5 py-0.5 rounded-md bg-[#3a3a3a] text-[#888]">
                        OFF
                      </span>
                    </div>
                  </div>

                  {/* Expandable sounds panel on hover */}
                  <AnimatePresence>
                    {hovered && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-2.5 pb-2.5">
                          <div className="bg-[#2a2a2a] rounded-xl p-2.5">
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                ['🌧️', 'Rain', true],
                                ['🌲', 'Forest', true],
                                ['🌊', 'Ocean', false],
                                ['🔥', 'Fire', false],
                                ['☕', 'Cafe', false],
                                ['💨', 'Wind', false],
                                ['🐦', 'Birds', false],
                                ['⛈️', 'Thunder', false],
                              ].map(([icon, name, active]) => (
                                <div
                                  key={name}
                                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-center ${
                                    active
                                      ? 'bg-[#6366f1]/15 ring-1 ring-[#6366f1]/30'
                                      : 'bg-[#1a1a1a]/60'
                                  }`}
                                >
                                  <span className="text-sm">{icon}</span>
                                  <span className={`text-[8px] ${active ? 'text-[#818cf8]' : 'text-[#666]'}`}>
                                    {name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Right - status icons */}
            <div className="flex items-center gap-2 text-black/60">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                <rect x="1" y="6" width="18" height="12" rx="2" ry="2"/>
                <line x1="23" y1="13" x2="23" y2="11"/>
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-60">
                <path d="M5 12.55a11 11 0 0114 0"/>
                <path d="M1.42 9a16 16 0 0121.16 0"/>
                <path d="M8.53 16.11a6 6 0 016.95 0"/>
                <circle cx="12" cy="20" r="1" fill="currentColor"/>
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-60">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
            </div>
          </div>

          {/* Wallpaper */}
          <div className="relative">
            <img
              src="/mountain.jpg"
              alt="Mountain wallpaper"
              className="w-full h-auto block"
              draggable={false}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ──
export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Nav ── */}
      <nav className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="#" className="text-lg font-bold tracking-tight text-text">
          meow
        </a>
        <a
          href="#faq"
          className="text-sm text-text-secondary hover:text-text transition-colors"
        >
          FAQ
        </a>
      </nav>

      {/* ── Mac Screen Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-8 pb-12">
        <MacScreen />
      </section>

      {/* ── Headline & CTA ── */}
      <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-hand text-6xl sm:text-7xl md:text-8xl leading-[1.05] text-text"
        >
          Focus mode. Made delightful.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-lg text-text-secondary max-w-md mx-auto leading-relaxed"
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
            className="inline-flex items-center gap-2 bg-text text-white font-medium px-6 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm"
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
            className="inline-flex items-center gap-2 bg-white text-text font-medium px-6 py-3 rounded-full border border-border hover:border-text-muted transition-colors text-sm"
          >
            Purchase $4.99
          </a>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="font-hand text-4xl text-text mb-8">Questions</h2>
        <div>
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-2xl mx-auto px-6 py-8 text-center">
        <p className="text-sm text-text-muted">
          Made with care &middot; meow
        </p>
      </footer>
    </div>
  );
}
