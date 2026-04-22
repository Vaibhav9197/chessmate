import React from 'react';
import { UNICODE } from '../logic/chess';

export default function PromotionDialog({ color, onChoose }) {
  const pieces = color === 'w' ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.70)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 20, borderRadius: 4,
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-primary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        alignItems: 'center',
      }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Promote to</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {pieces.map((p) => (
            <div
              key={p}
              onClick={() => onChoose(p.toUpperCase())}
              style={{
                width: 64, height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid var(--color-border-secondary)',
                fontSize: 42,
                color: color === 'w' ? '#fff' : '#111',
                WebkitTextStroke: color === 'w' ? '0.8px #333' : '0.5px #bbb',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background-info)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            >
              {UNICODE[p]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
