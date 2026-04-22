export const rankOf = (s) => 7 - Math.floor(s / 8);
export const fileOf = (s) => s % 8;
export const SQ = (f, r) => (7 - r) * 8 + f;
export const sqName = (s) => String.fromCharCode(97 + fileOf(s)) + (rankOf(s) + 1);

export const parseSq = (n) => {
  if (!n || n.length < 2) return null;
  const f = n.charCodeAt(0) - 97;
  const r = parseInt(n[1]) - 1;
  return f >= 0 && f < 8 && r >= 0 && r < 8 ? SQ(f, r) : null;
};

export const isUpper = (p) => p && p === p.toUpperCase() && /[A-Z]/.test(p);
export const COL = (p) => (!p ? null : isUpper(p) ? 'w' : 'b');
export const TYP = (p) => (p ? p.toUpperCase() : null);

export const UNICODE = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function parseFEN(fen) {
  try {
    const [pos, turn, cas, ep, hm, fm] = (fen || START_FEN).split(' ');
    const board = Array(64).fill(null);
    pos.split('/').forEach((rk, r) => {
      let f = 0;
      for (const c of rk) {
        if (c >= '1' && c <= '8') f += +c;
        else { board[r * 8 + f] = c; f++; }
      }
    });
    return {
      board,
      turn: turn || 'w',
      cas: cas || '-',
      ep: ep && ep !== '-' ? parseSq(ep) : null,
      hm: +hm || 0,
      fm: +fm || 1,
    };
  } catch {
    return parseFEN(START_FEN);
  }
}

export function toFEN({ board, turn, cas, ep, hm, fm }) {
  let p = '';
  for (let r = 0; r < 8; r++) {
    let e = 0;
    for (let f = 0; f < 8; f++) {
      const pc = board[r * 8 + f];
      if (pc) { if (e) { p += e; e = 0; } p += pc; } else e++;
    }
    if (e) p += e;
    if (r < 7) p += '/';
  }
  return `${p} ${turn} ${cas || '-'} ${ep != null ? sqName(ep) : '-'} ${hm} ${fm}`;
}

function isAttackedBy(board, sq, byColor) {
  const r = rankOf(sq), f = fileOf(sq);
  const knightDirs = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [df, dr] of knightDirs) {
    const f2 = f + df, r2 = r + dr;
    if (f2 >= 0 && f2 < 8 && r2 >= 0 && r2 < 8) {
      const p = board[SQ(f2, r2)];
      if (p && COL(p) === byColor && TYP(p) === 'N') return true;
    }
  }
  for (const [df, dr] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    let ff = f + df, rr = r + dr, d = 1;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const p = board[SQ(ff, rr)];
      if (p) {
        if (COL(p) === byColor && (TYP(p) === 'R' || TYP(p) === 'Q' || (d === 1 && TYP(p) === 'K'))) return true;
        break;
      }
      ff += df; rr += dr; d++;
    }
  }
  for (const [df, dr] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    let ff = f + df, rr = r + dr, d = 1;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const p = board[SQ(ff, rr)];
      if (p) {
        if (COL(p) === byColor && (TYP(p) === 'B' || TYP(p) === 'Q' || (d === 1 && TYP(p) === 'K'))) return true;
        break;
      }
      ff += df; rr += dr; d++;
    }
  }
  const pd = byColor === 'w' ? -1 : 1;
  for (const df of [-1, 1]) {
    const f2 = f + df, r2 = r + pd;
    if (f2 >= 0 && f2 < 8 && r2 >= 0 && r2 < 8) {
      const p = board[SQ(f2, r2)];
      if (p && COL(p) === byColor && TYP(p) === 'P') return true;
    }
  }
  return false;
}

export function inCheck(state, color) {
  const king = color === 'w' ? 'K' : 'k';
  const kp = state.board.indexOf(king);
  return kp >= 0 && isAttackedBy(state.board, kp, color === 'w' ? 'b' : 'w');
}

export function applyMove(state, mv) {
  const board = [...state.board];
  const { from, to, special } = mv;
  const piece = board[from];
  const isW = COL(piece) === 'w';
  const wasCapture = board[to] !== null;
  const wasPawn = TYP(piece) === 'P';
  board[to] = piece;
  board[from] = null;
  let newEp = null;
  let newCas = state.cas;

  if (special === 'ep') board[SQ(fileOf(to), rankOf(from))] = null;
  else if (special === 'double') newEp = SQ(fileOf(from), isW ? rankOf(from) + 1 : rankOf(from) - 1);
  else if (special && 'QRBN'.includes(special)) board[to] = isW ? special : special.toLowerCase();
  else if (special === 'cK') { board[SQ(5, 0)] = 'R'; board[SQ(7, 0)] = null; }
  else if (special === 'cQ') { board[SQ(3, 0)] = 'R'; board[SQ(0, 0)] = null; }
  else if (special === 'ck') { board[SQ(5, 7)] = 'r'; board[SQ(7, 7)] = null; }
  else if (special === 'cq') { board[SQ(3, 7)] = 'r'; board[SQ(0, 7)] = null; }

  if (piece === 'K') newCas = newCas.replace(/[KQ]/g, '');
  if (piece === 'k') newCas = newCas.replace(/[kq]/g, '');
  if (from === SQ(7,0) || to === SQ(7,0)) newCas = newCas.replace('K', '');
  if (from === SQ(0,0) || to === SQ(0,0)) newCas = newCas.replace('Q', '');
  if (from === SQ(7,7) || to === SQ(7,7)) newCas = newCas.replace('k', '');
  if (from === SQ(0,7) || to === SQ(0,7)) newCas = newCas.replace('q', '');
  if (!newCas) newCas = '-';

  return {
    board,
    turn: state.turn === 'w' ? 'b' : 'w',
    cas: newCas,
    ep: newEp,
    hm: wasPawn || wasCapture ? 0 : state.hm + 1,
    fm: state.turn === 'b' ? state.fm + 1 : state.fm,
  };
}

export function getLegalMoves(state, from) {
  const { board, turn, cas, ep } = state;
  const piece = board[from];
  if (!piece || COL(piece) !== turn) return [];
  const r = rankOf(from), f = fileOf(from), pt = TYP(piece), W = turn === 'w';
  const moves = [];

  const add = (to, special = null) => {
    if (to < 0 || to > 63) return;
    const t = board[to];
    if (t && COL(t) === turn) return;
    moves.push({ from, to, special });
  };

  const ray = (df, dr) => {
    let ff = f + df, rr = r + dr;
    while (ff >= 0 && ff < 8 && rr >= 0 && rr < 8) {
      const s2 = SQ(ff, rr);
      if (board[s2]) { if (COL(board[s2]) !== turn) moves.push({ from, to: s2, special: null }); break; }
      moves.push({ from, to: s2, special: null });
      ff += df; rr += dr;
    }
  };

  if (pt === 'P') {
    const dir = W ? 1 : -1, startR = W ? 1 : 6, promoR = W ? 7 : 0, nr = r + dir;
    if (nr >= 0 && nr <= 7) {
      const fwd = SQ(f, nr);
      if (!board[fwd]) {
        if (nr === promoR) ['Q','R','B','N'].forEach(p => moves.push({ from, to: fwd, special: p }));
        else {
          moves.push({ from, to: fwd });
          if (r === startR) { const d = SQ(f, r + 2 * dir); if (!board[d]) moves.push({ from, to: d, special: 'double' }); }
        }
      }
      for (const df of [-1, 1]) {
        const f2 = f + df;
        if (f2 < 0 || f2 > 7) continue;
        const cs = SQ(f2, nr), ct = board[cs];
        if (ct && COL(ct) !== turn) {
          if (nr === promoR) ['Q','R','B','N'].forEach(p => moves.push({ from, to: cs, special: p }));
          else moves.push({ from, to: cs });
        }
        if (ep === cs) moves.push({ from, to: cs, special: 'ep' });
      }
    }
  } else if (pt === 'N') {
    for (const [df, dr] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const f2 = f + df, r2 = r + dr;
      if (f2 >= 0 && f2 < 8 && r2 >= 0 && r2 < 8) add(SQ(f2, r2));
    }
  } else if (pt === 'B') [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([df,dr]) => ray(df, dr));
  else if (pt === 'R') [[-1,0],[1,0],[0,-1],[0,1]].forEach(([df,dr]) => ray(df, dr));
  else if (pt === 'Q') [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]].forEach(([df,dr]) => ray(df, dr));
  else if (pt === 'K') {
    for (const [df, dr] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const f2 = f + df, r2 = r + dr;
      if (f2 >= 0 && f2 < 8 && r2 >= 0 && r2 < 8) add(SQ(f2, r2));
    }
    const cr = W ? 0 : 7, op = W ? 'b' : 'w';
    if (W && cas.includes('K') && !board[SQ(5,0)] && !board[SQ(6,0)] && !isAttackedBy(board,SQ(4,0),op) && !isAttackedBy(board,SQ(5,0),op))
      moves.push({ from, to: SQ(6, cr), special: 'cK' });
    if (W && cas.includes('Q') && !board[SQ(3,0)] && !board[SQ(2,0)] && !board[SQ(1,0)] && !isAttackedBy(board,SQ(4,0),op) && !isAttackedBy(board,SQ(3,0),op))
      moves.push({ from, to: SQ(2, cr), special: 'cQ' });
    if (!W && cas.includes('k') && !board[SQ(5,7)] && !board[SQ(6,7)] && !isAttackedBy(board,SQ(4,7),op) && !isAttackedBy(board,SQ(5,7),op))
      moves.push({ from, to: SQ(6, cr), special: 'ck' });
    if (!W && cas.includes('q') && !board[SQ(3,7)] && !board[SQ(2,7)] && !board[SQ(1,7)] && !isAttackedBy(board,SQ(4,7),op) && !isAttackedBy(board,SQ(3,7),op))
      moves.push({ from, to: SQ(2, cr), special: 'cq' });
  }

  return moves.filter(m => { const ns = applyMove(state, m); return !inCheck(ns, turn); });
}

export function toSAN(state, mv) {
  const { board } = state;
  const piece = board[mv.from];
  const pt = TYP(piece);
  const isCapture = board[mv.to] !== null || mv.special === 'ep';
  if (mv.special === 'cK' || mv.special === 'ck') return 'O-O';
  if (mv.special === 'cQ' || mv.special === 'cq') return 'O-O-O';
  let san = pt === 'P' ? '' : pt;
  if (pt !== 'P') {
    const amb = [];
    for (let s = 0; s < 64; s++) {
      if (s === mv.from || board[s] !== piece) continue;
      if (getLegalMoves(state, s).some(m => m.to === mv.to)) amb.push(s);
    }
    if (amb.length > 0) {
      const sameFile = amb.some(s => fileOf(s) === fileOf(mv.from));
      const sameRank = amb.some(s => rankOf(s) === rankOf(mv.from));
      if (!sameFile) san += String.fromCharCode(97 + fileOf(mv.from));
      else if (!sameRank) san += (rankOf(mv.from) + 1);
      else san += sqName(mv.from);
    }
  }
  if (isCapture) { if (pt === 'P') san += String.fromCharCode(97 + fileOf(mv.from)); san += 'x'; }
  san += sqName(mv.to);
  if (mv.special && 'QRBN'.includes(mv.special)) san += '=' + mv.special;
  const ns = applyMove(state, mv);
  if (inCheck(ns, ns.turn)) {
    let hasMoves = false;
    for (let s = 0; s < 64; s++) { if (COL(ns.board[s]) === ns.turn && getLegalMoves(ns, s).length > 0) { hasMoves = true; break; } }
    san += hasMoves ? '+' : '#';
  }
  return san;
}

export function fromSAN(state, san) {
  let s = san.replace(/[+#!?]/g, '').trim();
  if (s === 'O-O' || s === '0-0') {
    const r = state.turn === 'w' ? 0 : 7;
    return { from: SQ(4, r), to: SQ(6, r), special: state.turn === 'w' ? 'cK' : 'ck' };
  }
  if (s === 'O-O-O' || s === '0-0-0') {
    const r = state.turn === 'w' ? 0 : 7;
    return { from: SQ(4, r), to: SQ(2, r), special: state.turn === 'w' ? 'cQ' : 'cq' };
  }
  let text = s, promo = null;
  const pm = text.match(/=([QRBN])$/);
  if (pm) { promo = pm[1]; text = text.slice(0, -2); }
  text = text.replace('x', '');
  let pt = 'P';
  if (text[0] >= 'A' && text[0] <= 'Z') { pt = text[0]; text = text.slice(1); }
  if (text.length < 2) return null;
  const tf = text.charCodeAt(text.length - 2) - 97;
  const tr = +text[text.length - 1] - 1;
  if (tf < 0 || tf > 7 || isNaN(tr) || tr < 0 || tr > 7) return null;
  const toSq = SQ(tf, tr);
  const dis = text.slice(0, -2);
  let dF = null, dR = null;
  if (dis.length === 1) { if (dis >= 'a' && dis <= 'h') dF = dis.charCodeAt(0) - 97; else if (dis >= '1' && dis <= '8') dR = +dis - 1; }
  else if (dis.length === 2) { dF = dis.charCodeAt(0) - 97; dR = +dis[1] - 1; }
  const mp = state.turn === 'w' ? pt : pt.toLowerCase();
  for (let sq = 0; sq < 64; sq++) {
    if (state.board[sq] !== mp) continue;
    if (dF !== null && fileOf(sq) !== dF) continue;
    if (dR !== null && rankOf(sq) !== dR) continue;
    const ms = getLegalMoves(state, sq);
    const m = ms.find(mv => mv.to === toSq && (!promo || mv.special === promo));
    if (m) return m;
  }
  return null;
}

export function isTerminal(state) {
  for (let s = 0; s < 64; s++) {
    if (COL(state.board[s]) === state.turn && getLegalMoves(state, s).length > 0) return false;
  }
  return true;
}

export function getGameStatus(state) {
  if (!isTerminal(state)) return null;
  return inCheck(state, state.turn) ? (state.turn === 'w' ? 'Black wins' : 'White wins') : 'Draw — Stalemate';
}
