import React from 'react';
import { UNICODE, isUpper } from '../logic/chess';

const LIGHT_SQ = '#f0d9b5';
const DARK_SQ  = '#b58863';

export default function Square({
  piece, sq, isLight, isSelected, isLastMove, isBestMove,
  isLegalTarget, isLegalCapture, onClick, onDragStart,
  onDragOver, onDrop, rankLabel, fileLabel,
}) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        width: 64, height: 64,
        background: isLight ? LIGHT_SQ : DARK_SQ,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isLegalTarget ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {isLastMove && <div style={{ position: 'absolute', inset: 0, background: 'rgba(235,200,20,0.42)' }} />}
      {isBestMove  && <div style={{ position: 'absolute', inset: 0, background: 'rgba(50,140,255,0.40)' }} />}
      {isSelected  && <div style={{ position: 'absolute', inset: 0, background: 'rgba(80,220,80,0.50)' }} />}

      {isLegalTarget && !isLegalCapture && (
        <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.22)', zIndex: 1 }} />
      )}
      {isLegalCapture && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(0,0,0,0.22)', boxSizing: 'border-box', zIndex: 1 }} />
      )}

      {piece && (
        <div
          draggable
          onDragStart={onDragStart}
          style={{
            position: 'relative', zIndex: 2,
            fontSize: 44, lineHeight: 1,
            cursor: 'grab',
            color: isUpper(piece) ? '#fff' : '#111',
            WebkitTextStroke: isUpper(piece) ? '0.8px #333' : '0.5px #bbb',
            textShadow: isUpper(piece) ? '0 1px 3px rgba(0,0,0,0.8)' : '0 1px 3px rgba(255,255,255,0.1)',
          }}
        >
          {UNICODE[piece]}
        </div>
      )}

      {rankLabel !== undefined && (
        <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 10, color: isLight ? DARK_SQ : LIGHT_SQ, fontWeight: 'bold', lineHeight: 1, zIndex: 3 }}>
          {rankLabel}
        </span>
      )}
      {fileLabel !== undefined && (
        <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 10, color: isLight ? DARK_SQ : LIGHT_SQ, fontWeight: 'bold', lineHeight: 1, zIndex: 3 }}>
          {fileLabel}
        </span>
      )}
    </div>
  );
}
