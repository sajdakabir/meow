'use client';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('meow-history') || '[]');
      setHistory(saved);
    } catch {}
  }, []);

  const clearHistory = () => {
    localStorage.setItem('meow-history', '[]');
    setHistory([]);
  };

  const formatType = (type) => {
    if (type === 'work' || type === 'focus') return 'Focus';
    if (type === 'shortBreak') return 'Short Break';
    if (type === 'longBreak') return 'Long Break';
    return 'Focus';
  };

  const getIcon = (type) => {
    return type === 'work' || type === 'focus' ? '\u23F1\uFE0F' : '\u2615';
  };

  return (
    <div className="min-h-screen p-4" style={{ background: '#1c1c1e' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-semibold text-text-primary">Session History</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[11px] px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: '#2c2c2e', color: '#ff6b6b' }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* List */}
      {history.length === 0 ? (
        <div className="text-center mt-16">
          <div className="text-3xl mb-3">{'\u{1F431}'}</div>
          <p className="text-text-muted text-sm">No sessions yet.</p>
          <p className="text-text-muted text-xs mt-1">Start focusing and your history will show up here!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {history.map((h, i) => {
            const d = new Date(h.date);
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3.5 py-2.5"
                style={{ background: '#2c2c2e', borderRadius: 12 }}
              >
                <span className="text-lg">{getIcon(h.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-text-primary">{formatType(h.type)}</div>
                  {h.task && (
                    <div className="text-[11px] text-text-muted truncate">{h.task}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-semibold text-accent-light">{h.duration} min</div>
                  <div className="text-[10px] text-text-muted">{date} {time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
