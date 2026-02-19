'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PALS = [
  {
    id: 'cat',
    name: 'Luna',
    icon: '🐱',
    body: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Body */}
        <ellipse cx="60" cy="75" rx="30" ry="25" fill="#FFB366" />
        {/* Head */}
        <circle cx="60" cy="45" r="22" fill="#FFB366" />
        {/* Ears */}
        <polygon points="42,30 38,10 52,25" fill="#FFB366" />
        <polygon points="78,30 82,10 68,25" fill="#FFB366" />
        <polygon points="43,28 40,14 51,25" fill="#FF9999" />
        <polygon points="77,28 80,14 69,25" fill="#FF9999" />
        {/* Eyes */}
        <g className="blink">
          <ellipse cx="50" cy="43" rx="4" ry="4.5" fill="#2D2D2D" />
          <ellipse cx="70" cy="43" rx="4" ry="4.5" fill="#2D2D2D" />
          <circle cx="48" cy="41" r="1.5" fill="white" />
          <circle cx="68" cy="41" r="1.5" fill="white" />
        </g>
        {/* Nose */}
        <ellipse cx="60" cy="50" rx="2.5" ry="2" fill="#FF8080" />
        {/* Mouth */}
        <path d="M56 52 Q60 56 64 52" fill="none" stroke="#CC6633" strokeWidth="1" />
        {/* Whiskers */}
        <line x1="35" y1="48" x2="48" y2="49" stroke="#CC9966" strokeWidth="0.8" />
        <line x1="35" y1="52" x2="48" y2="51" stroke="#CC9966" strokeWidth="0.8" />
        <line x1="72" y1="49" x2="85" y2="48" stroke="#CC9966" strokeWidth="0.8" />
        <line x1="72" y1="51" x2="85" y2="52" stroke="#CC9966" strokeWidth="0.8" />
        {/* Tail */}
        <path d="M88 80 Q100 60 95 45" fill="none" stroke="#FFB366" strokeWidth="5" strokeLinecap="round" />
        {/* Paws */}
        <ellipse cx="45" cy="95" rx="8" ry="5" fill="#FFB366" />
        <ellipse cx="75" cy="95" rx="8" ry="5" fill="#FFB366" />
      </svg>
    ),
  },
  {
    id: 'fox',
    name: 'Rusty',
    icon: '🦊',
    body: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Body */}
        <ellipse cx="60" cy="78" rx="28" ry="22" fill="#E87040" />
        {/* White belly */}
        <ellipse cx="60" cy="82" rx="18" ry="15" fill="#FFF5E6" />
        {/* Head */}
        <circle cx="60" cy="45" r="22" fill="#E87040" />
        {/* Face white */}
        <ellipse cx="60" cy="50" rx="14" ry="12" fill="#FFF5E6" />
        {/* Ears */}
        <polygon points="40,28 34,5 52,22" fill="#E87040" />
        <polygon points="80,28 86,5 68,22" fill="#E87040" />
        <polygon points="42,26 37,10 51,22" fill="#2D2D2D" />
        <polygon points="78,26 83,10 69,22" fill="#2D2D2D" />
        {/* Eyes */}
        <g className="blink">
          <ellipse cx="50" cy="42" rx="3.5" ry="4" fill="#2D2D2D" />
          <ellipse cx="70" cy="42" rx="3.5" ry="4" fill="#2D2D2D" />
          <circle cx="48.5" cy="40.5" r="1.2" fill="white" />
          <circle cx="68.5" cy="40.5" r="1.2" fill="white" />
        </g>
        {/* Nose */}
        <ellipse cx="60" cy="49" rx="3" ry="2.5" fill="#2D2D2D" />
        {/* Mouth */}
        <path d="M57 52 Q60 55 63 52" fill="none" stroke="#CC6633" strokeWidth="1" />
        {/* Tail */}
        <path d="M86 82 Q105 65 100 48" fill="none" stroke="#E87040" strokeWidth="7" strokeLinecap="round" />
        <circle cx="100" cy="48" r="4" fill="#FFF5E6" />
        {/* Paws */}
        <ellipse cx="45" cy="96" rx="7" ry="4" fill="#2D2D2D" />
        <ellipse cx="75" cy="96" rx="7" ry="4" fill="#2D2D2D" />
      </svg>
    ),
  },
  {
    id: 'owl',
    name: 'Hoot',
    icon: '🦉',
    body: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Body */}
        <ellipse cx="60" cy="72" rx="30" ry="32" fill="#8B6F47" />
        {/* Belly pattern */}
        <ellipse cx="60" cy="78" rx="20" ry="22" fill="#D4B896" />
        {/* Head */}
        <circle cx="60" cy="38" r="24" fill="#8B6F47" />
        {/* Ear tufts */}
        <polygon points="40,20 32,2 48,18" fill="#8B6F47" />
        <polygon points="80,20 88,2 72,18" fill="#8B6F47" />
        {/* Eye circles */}
        <circle cx="48" cy="36" r="12" fill="#D4B896" />
        <circle cx="72" cy="36" r="12" fill="#D4B896" />
        {/* Eyes */}
        <g className="blink">
          <circle cx="48" cy="36" r="6" fill="#2D2D2D" />
          <circle cx="72" cy="36" r="6" fill="#2D2D2D" />
          <circle cx="46" cy="34" r="2.5" fill="white" />
          <circle cx="70" cy="34" r="2.5" fill="white" />
          <circle cx="50" cy="38" r="1" fill="white" />
          <circle cx="74" cy="38" r="1" fill="white" />
        </g>
        {/* Beak */}
        <polygon points="56,46 60,54 64,46" fill="#E8A020" />
        {/* Wings */}
        <ellipse cx="32" cy="68" rx="10" ry="22" fill="#705530" transform="rotate(-10 32 68)" />
        <ellipse cx="88" cy="68" rx="10" ry="22" fill="#705530" transform="rotate(10 88 68)" />
        {/* Feet */}
        <path d="M48 100 L44 108 M48 100 L48 108 M48 100 L52 108" stroke="#E8A020" strokeWidth="2" strokeLinecap="round" />
        <path d="M72 100 L68 108 M72 100 L72 108 M72 100 L76 108" stroke="#E8A020" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'panda',
    name: 'Bamboo',
    icon: '🐼',
    body: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Body */}
        <ellipse cx="60" cy="78" rx="30" ry="25" fill="white" />
        {/* Head */}
        <circle cx="60" cy="45" r="25" fill="white" />
        {/* Ears */}
        <circle cx="38" cy="22" r="10" fill="#2D2D2D" />
        <circle cx="82" cy="22" r="10" fill="#2D2D2D" />
        {/* Eye patches */}
        <ellipse cx="48" cy="42" rx="10" ry="9" fill="#2D2D2D" transform="rotate(-10 48 42)" />
        <ellipse cx="72" cy="42" rx="10" ry="9" fill="#2D2D2D" transform="rotate(10 72 42)" />
        {/* Eyes */}
        <g className="blink">
          <circle cx="48" cy="42" r="4" fill="white" />
          <circle cx="72" cy="42" r="4" fill="white" />
          <circle cx="47" cy="41" r="2" fill="#2D2D2D" />
          <circle cx="71" cy="41" r="2" fill="#2D2D2D" />
          <circle cx="46" cy="40" r="0.8" fill="white" />
          <circle cx="70" cy="40" r="0.8" fill="white" />
        </g>
        {/* Nose */}
        <ellipse cx="60" cy="52" rx="4" ry="3" fill="#2D2D2D" />
        {/* Mouth */}
        <path d="M56 55 Q60 59 64 55" fill="none" stroke="#2D2D2D" strokeWidth="1.2" />
        {/* Arms */}
        <ellipse cx="34" cy="75" rx="10" ry="7" fill="#2D2D2D" transform="rotate(-20 34 75)" />
        <ellipse cx="86" cy="75" rx="10" ry="7" fill="#2D2D2D" transform="rotate(20 86 75)" />
        {/* Legs */}
        <ellipse cx="45" cy="98" rx="10" ry="6" fill="#2D2D2D" />
        <ellipse cx="75" cy="98" rx="10" ry="6" fill="#2D2D2D" />
      </svg>
    ),
  },
  {
    id: 'bear',
    name: 'Honey',
    icon: '🐻',
    body: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Body */}
        <ellipse cx="60" cy="78" rx="32" ry="26" fill="#A0522D" />
        {/* Belly */}
        <ellipse cx="60" cy="82" rx="20" ry="18" fill="#D2A679" />
        {/* Head */}
        <circle cx="60" cy="42" r="24" fill="#A0522D" />
        {/* Ears */}
        <circle cx="38" cy="22" r="9" fill="#A0522D" />
        <circle cx="82" cy="22" r="9" fill="#A0522D" />
        <circle cx="38" cy="22" r="5" fill="#D2A679" />
        <circle cx="82" cy="22" r="5" fill="#D2A679" />
        {/* Muzzle */}
        <ellipse cx="60" cy="50" rx="12" ry="9" fill="#D2A679" />
        {/* Eyes */}
        <g className="blink">
          <circle cx="48" cy="40" r="3.5" fill="#2D2D2D" />
          <circle cx="72" cy="40" r="3.5" fill="#2D2D2D" />
          <circle cx="47" cy="39" r="1.2" fill="white" />
          <circle cx="71" cy="39" r="1.2" fill="white" />
        </g>
        {/* Nose */}
        <ellipse cx="60" cy="48" rx="4" ry="3" fill="#2D2D2D" />
        {/* Mouth */}
        <path d="M56 52 Q60 56 64 52" fill="none" stroke="#8B4513" strokeWidth="1.2" />
        {/* Arms */}
        <ellipse cx="30" cy="72" rx="10" ry="8" fill="#A0522D" />
        <ellipse cx="90" cy="72" rx="10" ry="8" fill="#A0522D" />
        {/* Paws */}
        <ellipse cx="44" cy="100" rx="10" ry="5" fill="#A0522D" />
        <ellipse cx="76" cy="100" rx="10" ry="5" fill="#A0522D" />
      </svg>
    ),
  },
  {
    id: 'bunny',
    name: 'Clover',
    icon: '🐰',
    body: (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Body */}
        <ellipse cx="60" cy="80" rx="26" ry="24" fill="#F0E0D0" />
        {/* Head */}
        <circle cx="60" cy="50" r="22" fill="#F0E0D0" />
        {/* Ears */}
        <ellipse cx="46" cy="18" rx="6" ry="22" fill="#F0E0D0" transform="rotate(-10 46 18)" />
        <ellipse cx="74" cy="18" rx="6" ry="22" fill="#F0E0D0" transform="rotate(10 74 18)" />
        <ellipse cx="46" cy="18" rx="3.5" ry="18" fill="#FFB3B3" transform="rotate(-10 46 18)" />
        <ellipse cx="74" cy="18" rx="3.5" ry="18" fill="#FFB3B3" transform="rotate(10 74 18)" />
        {/* Cheeks */}
        <circle cx="42" cy="55" r="5" fill="#FFD4D4" opacity="0.5" />
        <circle cx="78" cy="55" r="5" fill="#FFD4D4" opacity="0.5" />
        {/* Eyes */}
        <g className="blink">
          <circle cx="50" cy="48" r="3.5" fill="#2D2D2D" />
          <circle cx="70" cy="48" r="3.5" fill="#2D2D2D" />
          <circle cx="49" cy="47" r="1.2" fill="white" />
          <circle cx="69" cy="47" r="1.2" fill="white" />
        </g>
        {/* Nose */}
        <ellipse cx="60" cy="54" rx="2.5" ry="2" fill="#FF9999" />
        {/* Mouth */}
        <path d="M57 56 L60 59 L63 56" fill="none" stroke="#CC8888" strokeWidth="1" />
        {/* Paws */}
        <ellipse cx="44" cy="100" rx="8" ry="4" fill="#F0E0D0" />
        <ellipse cx="76" cy="100" rx="8" ry="4" fill="#F0E0D0" />
        {/* Tail */}
        <circle cx="84" cy="90" r="6" fill="#FFFFFF" />
      </svg>
    ),
  },
];

export default function FocusPal({ timerMode, isRunning, showPal = true }) {
  const [selectedPal, setSelectedPal] = useState(0);
  const [showSelector, setShowSelector] = useState(false);

  if (!showPal) return null;

  const pal = PALS[selectedPal];
  const isBreak = timerMode !== 'work';

  return (
    <div className="flex flex-col items-center no-drag">
      {/* Companion display */}
      <motion.div
        className="relative cursor-pointer"
        onClick={() => setShowSelector(!showSelector)}
        style={{ width: 100, height: 100 }}
      >
        <motion.div
          className={isBreak ? 'sleepy' : isRunning ? 'breathe' : 'float'}
          style={{ width: '100%', height: '100%' }}
        >
          {pal.body}
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{
            backgroundColor: isBreak ? 'rgba(251, 191, 36, 0.2)' : isRunning ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            color: isBreak ? '#fbbf24' : isRunning ? '#34d399' : '#818cf8',
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          key={`${isBreak}-${isRunning}`}
        >
          {isBreak ? '💤 resting' : isRunning ? '✨ focusing' : '👋 ready!'}
        </motion.div>
      </motion.div>

      {/* Pal name */}
      <div className="text-xs text-text-muted mt-3">{pal.name} the {pal.icon}</div>

      {/* Pal selector */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="flex gap-2 p-2 rounded-xl bg-bg-card/50">
              {PALS.map((p, i) => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPal(i);
                    setShowSelector(false);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    i === selectedPal ? 'bg-accent/20 ring-1 ring-accent/50' : 'hover:bg-bg-hover'
                  }`}
                >
                  {p.icon}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
