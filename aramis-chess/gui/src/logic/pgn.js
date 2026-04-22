import { parseFEN, applyMove, fromSAN, START_FEN } from './chess';

export function parsePGN(text) {
  const headers = {};
  const headerRe = /\[(\w+)\s+"([^"]*)"\]/g;
  let m;
  while ((m = headerRe.exec(text)) !== null) headers[m[1]] = m[2];

  let body = text
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\$\d+/g, '');

  const tokens = body.trim().split(/\s+/);
  const sans = tokens.filter(
    (t) => t && !t.match(/^\d+\.+$/) && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/)
  );

  const startFen = headers.FEN || START_FEN;
  const positions = [{ state: parseFEN(startFen), san: null, move: null }];
  let state = parseFEN(startFen);

  for (const san of sans) {
    const mv = fromSAN(state, san);
    if (!mv) break;
    const ns = applyMove(state, mv);
    positions.push({ state: ns, san, move: mv });
    state = ns;
  }

  return { headers, positions };
}
