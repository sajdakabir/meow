'use client';
import { motion } from 'framer-motion';

export default function TitleBar({ onMinimize, onClose }) {
  return (
    <div className="drag-region flex items-center justify-between px-4 py-3">
      {/* Window controls */}
      <div className="flex items-center gap-2 no-drag">
        <motion.button
          whileHover={{ scale: 1.2 }}
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
        />
        <motion.button
          whileHover={{ scale: 1.2 }}
          onClick={onMinimize}
          className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors"
        />
        <div className="w-3 h-3 rounded-full bg-green-500/30" />
      </div>

      {/* App title */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-text-muted tracking-wide uppercase">
          Zen Focus
        </span>
      </div>

      {/* Spacer for alignment */}
      <div className="w-16" />
    </div>
  );
}
