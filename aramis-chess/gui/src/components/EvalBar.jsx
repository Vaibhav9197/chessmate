import React from 'react';

export default function EvalBar({ evalCp, isMate, mateIn }) {
  const pct = isMate
    ? (mateIn > 0 ? 97 : 3)
    : Math.max(3, Math.min(97, 50 + evalCp * 3.5));

  const label = isMate
    ? (mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`)
    : (evalCp >= 0 ? `+${evalCp.toFixed(1)}` : evalCp.toFixed(1));

  return (
    <div style={{
      width: 24, minHeight: 512,
      borderRadius: 4,
      border: '1px solid #444',
      overflow: 'hidden',
      position: 'relative',
      background: '#1e1e1e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Black side (top) */}
      <div style={{ flex: 1, background: '#2a2a2a', transition: 'flex 0.4s ease' }} />
      {/* White side (bottom) */}
      <div style={{
        height: `${pct}%`,
        background: '#f0f0f0',
        transition: 'height 0.4s ease',
        flexShrink: 0,
      }} />
      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: 6,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 8,
        fontFamily: 'monospace',
        color: pct > 55 ? '#555' : '#ccc',
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transform: 'translateX(-50%) rotate(180deg)',
      }}>
        {label}
      </div>
    </div>
  );
}
