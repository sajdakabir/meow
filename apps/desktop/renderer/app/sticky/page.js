'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { tauriBridge } from '../../lib/tauri-bridge';

/** Typing shouldn't hit the disk on every keystroke. */
const SAVE_DEBOUNCE_MS = 400;

export default function StickyNotePage() {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    tauriBridge.getStickyNote().then(note => {
      setText(note?.text || '');
      setLoaded(true);
    });
  }, []);

  // Focus the textarea on open so the note is immediately typeable.
  useEffect(() => {
    if (!loaded) return;
    tauriBridge.focusStickyNote();
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [loaded]);

  const scheduleSave = useCallback((value) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => tauriBridge.saveStickyNote(value), SAVE_DEBOUNCE_MS);
  }, []);

  // Flush any pending edit if the window goes away mid-debounce.
  useEffect(() => {
    const flush = () => {
      clearTimeout(saveTimer.current);
      tauriBridge.saveStickyNote(textareaRef.current?.value ?? '');
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('blur', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('blur', flush);
    };
  }, []);

  const onChange = (e) => {
    setText(e.target.value);
    scheduleSave(e.target.value);
  };

  const close = () => {
    clearTimeout(saveTimer.current);
    tauriBridge.saveStickyNote(textareaRef.current?.value ?? '')
      .finally(() => tauriBridge.closeStickyNote());
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden select-none"
      style={{
        // Same charcoal family as the notch card, a touch deeper at the
        // bottom so the note still reads as a physical slip of paper.
        background: 'linear-gradient(160deg, #323234 0%, #29292b 55%, #1f1f21 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 12,
      }}
    >
      {/* Header — the drag handle. data-tauri-drag-region lets the whole
          strip move the undecorated window. */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2 px-3 shrink-0 cursor-grab active:cursor-grabbing"
        style={{ height: 28, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div data-tauri-drag-region className="flex-1 flex items-center gap-1">
          {/* Three ruled lines as a grip affordance */}
          {[0, 1, 2].map(i => (
            <span
              key={i}
              data-tauri-drag-region
              style={{
                width: 3, height: 3, borderRadius: 999,
                background: 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
        <button
          onClick={close}
          title="Close note"
          className="flex items-center justify-center transition-colors cursor-pointer hover:brightness-150"
          style={{
            width: 18, height: 18, borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', border: 'none', color: '#98989d',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={onChange}
        onMouseDown={() => tauriBridge.focusStickyNote()}
        placeholder="Write it down…"
        spellCheck={false}
        className="flex-1 w-full resize-none outline-none bg-transparent select-text placeholder:text-text-muted"
        style={{
          padding: '10px 12px 12px',
          color: '#f5f5f5',
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: 'ui-rounded, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      />
    </div>
  );
}
