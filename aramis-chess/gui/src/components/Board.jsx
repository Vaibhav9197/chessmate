import React, { useState } from 'react';
import Square from './Square';
import PromotionDialog from './PromotionDialog';
import { SQ, fileOf, rankOf, getLegalMoves, COL, isUpper } from '../logic/chess';

export default function Board({ state, onMove, flipped, lastMove, bestMoveSqs }) {
  const [selectedSq, setSelectedSq] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [dragFrom, setDragFrom] = useState(null);
  const [promoPending, setPromoPending] = useState(null);

  const getDisplaySq = (row, col) =>
    flipped ? SQ(7 - col, row) : SQ(col, 7 - row);

  const legalTargets = new Set(legalMoves.map((m) => m.to));

  const handleSquareClick = (sq) => {
    if (selectedSq === sq) { setSelectedSq(null); setLegalMoves([]); return; }
    if (selectedSq !== null) {
      const promoMoves = legalMoves.filter((m) => m.to === sq && m.special && 'QRBN'.includes(m.special));
      if (promoMoves.length > 0) { setPromoPending({ from: selectedSq, to: sq }); setSelectedSq(null); setLegalMoves([]); return; }
      const mv = legalMoves.find((m) => m.to === sq);
      if (mv) { onMove(mv); setSelectedSq(null); setLegalMoves([]); return; }
    }
    if (state.board[sq] && COL(state.board[sq]) === state.turn) {
      setSelectedSq(sq);
      setLegalMoves(getLegalMoves(state, sq));
    } else {
      setSelectedSq(null);
      setLegalMoves([]);
    }
  };

  const handleDrop = (e, sq) => {
    e.preventDefault();
    if (dragFrom === null) return;
    const moves = getLegalMoves(state, dragFrom);
    const promoMoves = moves.filter((m) => m.to === sq && m.special && 'QRBN'.includes(m.special));
    if (promoMoves.length > 0) { setPromoPending({ from: dragFrom, to: sq }); }
    else { const mv = moves.find((m) => m.to === sq); if (mv) onMove(mv); }
    setDragFrom(null); setSelectedSq(null); setLegalMoves([]);
  };

  const handlePromoChoice = (piece) => {
    if (!promoPending) return;
    const moves = getLegalMoves(state, promoPending.from);
    const mv = moves.find((m) => m.to === promoPending.to && m.special === piece);
    if (mv) onMove(mv);
    setPromoPending(null);
  };

  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = getDisplaySq(row, col);
      const piece = state.board[sq];
      const isLight = (fileOf(sq) + rankOf(sq)) % 2 === 1;
      const isLegCapture = legalTargets.has(sq) && piece !== null;
      squares.push(
        <Square
          key={sq}
          piece={piece}
          sq={sq}
          isLight={isLight}
          isSelected={selectedSq === sq}
          isLastMove={lastMove && (lastMove.from === sq || lastMove.to === sq)}
          isBestMove={bestMoveSqs && (bestMoveSqs.from === sq || bestMoveSqs.to === sq)}
          isLegalTarget={legalTargets.has(sq)}
          isLegalCapture={isLegCapture}
          onClick={() => handleSquareClick(sq)}
          onDragStart={(e) => {
            if (!piece || COL(piece) !== state.turn) { e.preventDefault(); return; }
            setDragFrom(sq); setSelectedSq(sq);
            setLegalMoves(getLegalMoves(state, sq));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => handleDrop(e, sq)}
          rankLabel={col === 0 ? rankOf(sq) + 1 : undefined}
          fileLabel={row === 7 ? String.fromCharCode(97 + fileOf(sq)) : undefined}
        />
      );
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 64px)',
        gridTemplateRows: 'repeat(8, 64px)',
        border: '2px solid #7a5c3a',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 6px 28px rgba(0,0,0,0.45)',
      }}>
        {squares}
      </div>
      {promoPending && (
        <PromotionDialog color={state.turn} onChoose={handlePromoChoice} />
      )}
    </div>
  );
}
