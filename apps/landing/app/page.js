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

// ── App Preview (mock of the actual desktop app) ──
function AppPreview() {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="relative group">
      <p className="text-center text-text-muted text-sm mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
        Try hovering on this!
      </p>
      <motion.div
        className="relative mx-auto max-w-[340px] cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ y: hovered ? -4 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Shadow */}
        <div className="absolute -inset-4 bg-black/5 rounded-3xl blur-2xl transition-all group-hover:bg-black/10 group-hover:blur-3xl" />

        {/* Card */}
        <div className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-xl">
          {/* Timer row */}
          <div className="p-3">
            <div className="bg-[#2a2a2a] rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="bg-[#3a3a3a] text-white text-sm font-semibold px-3 py-1.5 rounded-xl">
                25 min
              </div>
              <div className="flex-1 text-center text-[#a0a0a0] text-sm">
                Task
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-0.5">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pal + Music row */}
          <div className="px-3 pb-3 flex gap-2">
            <div className="flex-1 bg-[#2a2a2a] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-sm text-[#a0a0a0] font-medium">Focus Pal</span>
              <motion.span
                className="text-lg ml-auto"
                animate={hovered ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                🐱
              </motion.span>
            </div>
            <div className="flex-1 bg-[#2a2a2a] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-sm text-[#a0a0a0] font-medium">Music</span>
              <span className="text-[11px] font-bold ml-auto px-2 py-0.5 rounded-md bg-[#6366f1]/20 text-[#818cf8]">
                ON
              </span>
            </div>
          </div>

          {/* Sounds grid */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3">
                  <div className="bg-[#2a2a2a] rounded-2xl p-3">
                    <div className="grid grid-cols-4 gap-1.5">
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
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-center ${
                            active
                              ? 'bg-[#6366f1]/15 ring-1 ring-[#6366f1]/30'
                              : 'bg-[#1a1a1a]/60'
                          }`}
                        >
                          <span className="text-base">{icon}</span>
                          <span className={`text-[9px] ${active ? 'text-[#818cf8]' : 'text-[#666]'}`}>
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
  );
}

// ── Page ──
export default function Home() {
  return (
    <div className="min-h-screen font-sans">
      {/* ── Nav ── */}
      <nav className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
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

      {/* ── Hero ── */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-hand text-6xl sm:text-7xl md:text-8xl leading-[1.1] text-text"
        >
          Focus mode.{' '}
          <br className="sm:hidden" />
          Made delightful.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 text-lg text-text-secondary max-w-md mx-auto leading-relaxed"
        >
          A cozy menu-bar companion for your Mac with calming music and a focus
          pal by your side.
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
            className="inline-flex items-center gap-2 bg-bg-card text-text font-medium px-6 py-3 rounded-full border border-border hover:border-text-muted transition-colors text-sm"
          >
            Purchase $4.99
          </a>
        </motion.div>
      </section>

      {/* ── App Preview ── */}
      <section className="max-w-2xl mx-auto px-6 py-16">
        <AppPreview />
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="font-hand text-4xl text-text mb-8">
          Questions
        </h2>
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
