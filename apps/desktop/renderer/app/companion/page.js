'use client';
import { useState, useEffect } from 'react';

// Ear shapes for each pal — white silhouettes peeking from bottom
const PAL_EARS = {
  cat: (
    <svg viewBox="0 0 160 80" className="w-full h-full">
      {/* Left ear */}
      <polygon points="50,80 60,15 75,80" fill="white"/>
      <polygon points="54,75 60,25 70,75" fill="#FFB3B3" opacity="0.4"/>
      {/* Right ear */}
      <polygon points="85,80 100,15 110,80" fill="white"/>
      <polygon points="90,75 100,25 106,75" fill="#FFB3B3" opacity="0.4"/>
    </svg>
  ),
  fox: (
    <svg viewBox="0 0 160 80" className="w-full h-full">
      <polygon points="48,80 62,10 78,80" fill="white"/>
      <polygon points="52,75 62,20 74,75" fill="#2D2D2D" opacity="0.3"/>
      <polygon points="82,80 98,10 112,80" fill="white"/>
      <polygon points="86,75 98,20 108,75" fill="#2D2D2D" opacity="0.3"/>
    </svg>
  ),
  owl: (
    <svg viewBox="0 0 160 80" className="w-full h-full">
      {/* Feather tufts */}
      <ellipse cx="60" cy="55" rx="14" ry="30" fill="white"/>
      <ellipse cx="100" cy="55" rx="14" ry="30" fill="white"/>
    </svg>
  ),
  panda: (
    <svg viewBox="0 0 160 80" className="w-full h-full">
      {/* Round ears */}
      <circle cx="58" cy="45" r="18" fill="white"/>
      <circle cx="102" cy="45" r="18" fill="white"/>
      <circle cx="58" cy="45" r="10" fill="#2D2D2D" opacity="0.3"/>
      <circle cx="102" cy="45" r="10" fill="#2D2D2D" opacity="0.3"/>
    </svg>
  ),
  bunny: (
    <svg viewBox="0 0 160 80" className="w-full h-full">
      {/* Long ears */}
      <ellipse cx="62" cy="40" rx="8" ry="35" fill="white" transform="rotate(-8 62 40)"/>
      <ellipse cx="62" cy="40" rx="4" ry="28" fill="#FFB3B3" opacity="0.4" transform="rotate(-8 62 40)"/>
      <ellipse cx="98" cy="40" rx="8" ry="35" fill="white" transform="rotate(8 98 40)"/>
      <ellipse cx="98" cy="40" rx="4" ry="28" fill="#FFB3B3" opacity="0.4" transform="rotate(8 98 40)"/>
    </svg>
  ),
};

const PAL_IDS = ['cat', 'fox', 'owl', 'panda', 'bunny'];

export default function Companion() {
  const [palId, setPalId] = useState('cat');

  useEffect(() => {
    // Read selected pal from localStorage
    try {
      const saved = localStorage.getItem('zen-focus-pal');
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (PAL_IDS[idx]) setPalId(PAL_IDS[idx]);
      }
    } catch {}

    // Poll for changes (since companion is a separate window)
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem('zen-focus-pal');
        if (saved !== null) {
          const idx = parseInt(saved, 10);
          if (PAL_IDS[idx]) setPalId(PAL_IDS[idx]);
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Zzz floating above the ears */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center zzz-container">
        <span className="text-white/50 text-lg font-medium zzz-1">Z</span>
        <span className="text-white/40 text-sm font-medium -mt-1 ml-2 zzz-2">z</span>
        <span className="text-white/30 text-xs font-medium -mt-0.5 ml-4 zzz-3">z</span>
      </div>

      {/* Pal ears at the bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140px] h-[60px]">
        {PAL_EARS[palId] || PAL_EARS.cat}
      </div>
    </div>
  );
}
