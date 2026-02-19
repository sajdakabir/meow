'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Data ──
const FEATURES = [
  {
    icon: '🐱',
    title: 'Focus Pals',
    description:
      'Choose an adorable companion — Luna the cat, Rusty the fox, Hoot the owl & more — to keep you company while you work.',
  },
  {
    icon: '🎵',
    title: 'Ambient Sounds',
    description:
      'Layer rain, forest, ocean, fireplace and more. Mix your perfect soundscape to drown out distractions.',
  },
  {
    icon: '⏱️',
    title: 'Pomodoro Timer',
    description:
      'Stay in the zone with structured focus & break sessions. Auto-starts, progress bar, and gentle notifications.',
  },
];

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! meow is completely free during the beta period. Try every feature with no limitations.',
  },
  {
    q: 'What platforms are supported?',
    a: 'macOS is supported today. Windows support is coming soon.',
  },
  {
    q: 'Does meow collect my data?',
    a: 'No. meow runs entirely on your machine. We don\'t collect analytics, telemetry, or any personal data.',
  },
  {
    q: 'Can I customize the timer durations?',
    a: 'Absolutely. Adjust focus, short break, and long break durations from the settings panel. You can also toggle auto-start for breaks and focus sessions.',
  },
  {
    q: 'How does it work?',
    a: 'meow lives in your menu bar. Click to open a compact popover with your timer, focus pal, and ambient sounds — all without leaving your current app.',
  },
];

const PALS = ['🐱', '🦊', '🦉', '🐼', '🐰'];

// ── Fade-in animation wrapper ──
function FadeIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── FAQ Item ──
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-text-primary font-medium pr-4">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-muted text-xl flex-shrink-0 group-hover:text-accent-light transition-colors"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-text-secondary leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── App Preview (mock) ──
function AppPreview() {
  return (
    <div className="relative mx-auto max-w-[320px]">
      {/* Glow behind the card */}
      <div className="absolute inset-0 bg-accent/10 rounded-3xl blur-3xl scale-110" />

      {/* Mock app card */}
      <div className="relative bg-[#1a1a1a] rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Timer row */}
        <div className="p-3">
          <div className="bg-[#2a2a2a] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="bg-[#3a3a3a] text-white text-sm font-semibold px-3 py-1.5 rounded-xl">
              25 min
            </div>
            <div className="flex-1 text-center text-[#a0a0a0] text-sm">Task</div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white ml-0.5"
              >
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pal + Music row */}
        <div className="px-3 pb-3 flex gap-2">
          <div className="flex-1 bg-[#2a2a2a] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="text-sm text-[#a0a0a0] font-medium">Focus Pal</span>
            <span className="text-lg ml-auto">🐱</span>
          </div>
          <div className="flex-1 bg-[#2a2a2a] rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
            <span className="text-sm text-[#a0a0a0] font-medium">Music</span>
            <span className="text-[11px] font-bold ml-auto px-2 py-0.5 rounded-md bg-[#6366f1]/20 text-[#818cf8]">
              ON
            </span>
          </div>
        </div>

        {/* Sound grid mock */}
        <div className="px-3 pb-3">
          <div className="bg-[#2a2a2a] rounded-2xl p-3">
            <div className="grid grid-cols-4 gap-1.5">
              {['🌧️ Rain', '🌲 Forest', '🌊 Ocean', '🔥 Fire', '☕ Cafe', '💨 Wind', '🐦 Birds', '⛈️ Thunder'].map(
                (s, i) => (
                  <div
                    key={s}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-center ${
                      i < 2
                        ? 'bg-[#6366f1]/15 ring-1 ring-[#6366f1]/30'
                        : 'bg-[#1a1a1a]/60'
                    }`}
                  >
                    <span className="text-base">{s.split(' ')[0]}</span>
                    <span
                      className={`text-[9px] ${
                        i < 2 ? 'text-[#818cf8]' : 'text-[#666]'
                      }`}
                    >
                      {s.split(' ')[1]}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-bg-primary/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="text-xl font-bold tracking-tight text-text-primary">
            meow
          </a>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#faq"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              FAQ
            </a>
            <a
              href="#download"
              className="text-sm font-medium bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-xl transition-colors"
            >
              Download
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Floating pals */}
          <FadeIn>
            <div className="flex justify-center gap-3 mb-8">
              {PALS.map((pal, i) => (
                <motion.span
                  key={i}
                  className="text-3xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                >
                  {pal}
                </motion.span>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Focus mode.
              <br />
              <span className="text-accent-light">Made delightful.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-xl mx-auto leading-relaxed">
              A cozy menu-bar companion for your Mac. Pomodoro timer, ambient
              sounds & adorable focus pals — all without leaving your workflow.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#download"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-semibold px-8 py-3.5 rounded-2xl text-lg transition-colors shadow-lg shadow-accent/25"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download for Mac
              </a>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium px-6 py-3.5 rounded-2xl border border-border hover:border-text-muted transition-colors"
              >
                Learn more
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="mt-4 text-sm text-text-muted">
              Free during beta &middot; macOS 12+
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── App Preview ── */}
      <section className="py-16 px-6">
        <FadeIn>
          <AppPreview />
        </FadeIn>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Everything you need to stay focused
            </h2>
            <p className="text-text-secondary text-center max-w-lg mx-auto mb-16">
              Minimal by design. Powerful when you need it.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="bg-bg-card border border-border rounded-2xl p-6 hover:border-accent/30 hover:bg-bg-card-hover transition-all group">
                  <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform origin-left">
                    {f.icon}
                  </span>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-bg-secondary">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Lives in your menu bar
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-12">
              Click the icon in your menu bar to open meow. Start a focus session,
              pick your pal, layer some sounds — and get to work.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Open', desc: 'Click meow in your menu bar' },
                { step: '2', title: 'Set up', desc: 'Pick a pal & layer your sounds' },
                { step: '3', title: 'Focus', desc: 'Hit play and get in the zone' },
              ].map((s, i) => (
                <div key={s.step} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-accent/20 text-accent-light font-bold flex items-center justify-center mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-text-secondary text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Frequently asked questions
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-bg-card border border-border rounded-2xl px-6">
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section id="download" className="py-24 px-6">
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              className="text-6xl mb-6"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              🐱
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to focus?
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Download meow and make your focus sessions something you actually
              look forward to.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-accent/25"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download for Mac
            </a>
            <p className="mt-4 text-sm text-text-muted">
              Free during beta &middot; macOS 12+
            </p>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>&copy; 2026 meow. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-text-primary transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-text-primary transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
