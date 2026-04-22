import { parseSq, getLegalMoves } from './chess';

export function parseUCIMove(state, uci) {
  if (!uci || uci.length < 4) return null;
  const from = parseSq(uci.slice(0, 2));
  const to = parseSq(uci.slice(2, 4));
  if (from === null || to === null) return null;
  const promo = uci[4] ? uci[4].toUpperCase() : null;
  const moves = getLegalMoves(state, from);
  return moves.find((m) => m.to === to && (!promo || m.special === promo)) || null;
}

export function parseEngineInfo(line) {
  const result = {};
  const depthM = line.match(/depth (\d+)/);
  const cpM = line.match(/score cp (-?\d+)/);
  const mateM = line.match(/score mate (-?\d+)/);
  const pvM = line.match(/ pv (.+)/);
  const nodesM = line.match(/nodes (\d+)/);
  const npsM = line.match(/nps (\d+)/);
  if (depthM) result.depth = +depthM[1];
  if (cpM) { result.eval = +cpM[1] / 100; result.isMate = false; }
  if (mateM) { result.mateIn = +mateM[1]; result.isMate = true; }
  if (pvM) result.pv = pvM[1].trim().split(' ');
  if (nodesM) result.nodes = +nodesM[1];
  if (npsM) result.nps = +npsM[1];
  return result;
}
