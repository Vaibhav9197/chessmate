import React, { useRef, useEffect } from 'react';

export default function MoveHistory({ history, currentIdx, onJump }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      const el = ref.current.querySelector(`[data-idx="${currentIdx}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [currentIdx]);

  const pairs = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  if (pairs.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
        No moves yet
      </p>
    );
  }

  return (
    <div ref={ref} style={{ overflowY: 'auto', fontSize: 13, fontFamily: 'monospace', flex: 1 }}>
      {pairs.map((pair, i) => (
        <div key={i} style={{ display: 'flex', gap: 2, padding: '2px 4px', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-secondary)', minWidth: 28, fontSize: 11 }}>{i + 1}.</span>
          {pair.map((entry, j) => entry && (
            <span
              key={j}
              data-idx={i * 2 + j}
              onClick={() => onJump(i * 2 + j)}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                minWidth: 52,
                fontWeight: currentIdx === i * 2 + j ? 500 : 400,
                background: currentIdx === i * 2 + j ? 'var(--color-background-info)' : 'transparent',
                color: currentIdx === i * 2 + j ? 'var(--color-text-info)' : 'var(--color-text-primary)',
              }}
            >
              {entry.san}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
