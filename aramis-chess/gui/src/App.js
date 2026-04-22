import React, { useState, useCallback, useEffect, useRef } from 'react';
import Board from './components/Board';
import EvalBar from './components/EvalBar';
import MoveHistory from './components/MoveHistory';
import { useEngine } from './hooks/useEngine';
import { parseFEN, toFEN, applyMove, toSAN, getGameStatus, START_FEN } from './logic/chess';
import { parseUCIMove } from './logic/uci';
import { parsePGN } from './logic/pgn';
import './App.css';

const INIT_STATE = parseFEN(START_FEN);

export default function App() {
  const [wsUrl, setWsUrl]       = useState('ws://localhost:8080');
  const [wsInput, setWsInput]   = useState('ws://localhost:8080');
  const [depth, setDepth]       = useState(15);
  const [mode, setMode]         = useState('analysis');       // 'analysis' | 'play'
  const [playerColor, setPlayerColor] = useState('w');
  const [flipped, setFlipped]   = useState(false);

  // Game state
  const [history, setHistory]   = useState([]);               // [{san, state, move}]
  const [histIdx, setHistIdx]   = useState(-1);
  const [baseState]             = useState(INIT_STATE);
  const [lastMove, setLastMove] = useState(null);
  const [gameMsg, setGameMsg]   = useState('');

  // PGN
  const [pgn, setPgn]           = useState(null);             // {headers, positions, curIdx}

  const engineWaiting           = useRef(false);
  const engine = useEngine(wsUrl);

  // Which state is currently displayed
  const displayState = pgn
    ? pgn.positions[pgn.curIdx].state
    : (histIdx >= 0 ? history[histIdx].state : baseState);

  const displayLastMove = pgn
    ? (pgn.curIdx > 0 ? pgn.positions[pgn.curIdx].move : null)
    : lastMove;

  // Best-move squares from engine
  const bestMoveSqs = engine.bestMove ? parseUCIMove(displayState, engine.bestMove) : null;
  const bestMvSqsDisplay = bestMoveSqs
    ? { from: bestMoveSqs.from, to: bestMoveSqs.to }
    : null;

  // Trigger engine analysis whenever displayed position changes
  useEffect(() => {
    if (!engine.connected) return;
    const fen = toFEN(displayState);
    engine.analyze(fen, depth);
  }, [displayState, engine.connected, depth]); // eslint-disable-line

  // Handle a move played on the board
  const handleMove = useCallback((mv) => {
    const st = pgn
      ? pgn.positions[pgn.curIdx].state
      : (histIdx >= 0 ? history[histIdx].state : baseState);

    const san = toSAN(st, mv);
    const ns  = applyMove(st, mv);

    const newHist = [...history.slice(0, histIdx + 1), { san, state: ns, move: mv }];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setLastMove(mv);
    setPgn(null);

    const status = getGameStatus(ns);
    if (status) { setGameMsg(status); return; }
    setGameMsg('');

    if (mode === 'play' && ns.turn !== playerColor && engine.connected) {
      engineWaiting.current = true;
      engine.playMove(toFEN(ns), depth, (uci) => {
        engineWaiting.current = false;
        const engineMv = parseUCIMove(ns, uci);
        if (!engineMv) return;
        const san2 = toSAN(ns, engineMv);
        const ns2  = applyMove(ns, engineMv);
        setHistory((prev) => {
          const h = [...prev, { san: san2, state: ns2, move: engineMv }];
          setHistIdx(h.length - 1);
          return h;
        });
        setLastMove(engineMv);
        const s2 = getGameStatus(ns2);
        if (s2) setGameMsg(s2);
      });
    } else if (mode === 'analysis') {
      engine.analyze(toFEN(ns), depth);
    }
  }, [pgn, histIdx, history, baseState, mode, playerColor, engine, depth]);

  const navigate = useCallback((dir) => {
    if (pgn) {
      const ni = Math.max(0, Math.min(pgn.positions.length - 1, pgn.curIdx + dir));
      setPgn((p) => ({ ...p, curIdx: ni }));
    } else {
      setHistIdx((i) => Math.max(-1, Math.min(history.length - 1, i + dir)));
    }
  }, [pgn, history]);

  const newGame = useCallback(() => {
    setHistory([]); setHistIdx(-1); setLastMove(null);
    setPgn(null); setGameMsg('');
    engine.newGame();
  }, [engine]);

  const handlePGNLoad = useCallback((text) => {
    try {
      const { headers, positions } = parsePGN(text);
      setPgn({ headers, positions, curIdx: 0 });
      setHistory([]); setHistIdx(-1); setLastMove(null); setGameMsg('');
    } catch (e) {
      alert('PGN parse error: ' + e.message);
    }
  }, []);

  const evalLabel = engine.isMate
    ? (engine.mateIn > 0 ? `M${engine.mateIn}` : `-M${Math.abs(engine.mateIn)}`)
    : (engine.evalCp >= 0 ? `+${engine.evalCp.toFixed(2)}` : engine.evalCp.toFixed(2));

  const evalColor = engine.evalCp > 0.3
    ? 'var(--color-text-success)'
    : engine.evalCp < -0.3
      ? 'var(--color-text-danger)'
      : 'var(--color-text-primary)';

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <span className="logo">♞ Aramis Chess</span>
        <div className="header-right">
          {engine.status && <span className="status-text">{engine.status}</span>}
          <div className="dot" style={{ background: engine.connected ? 'var(--color-text-success)' : 'var(--color-text-danger)' }} />
          <span className="status-text">{engine.connected ? 'Engine online' : 'Engine offline'}</span>
        </div>
      </header>

      <div className="main-row">
        {/* ── Eval bar + Board ── */}
        <div className="board-area">
          <div className="eval-wrap">
            <EvalBar evalCp={engine.evalCp} isMate={engine.isMate} mateIn={engine.mateIn} />
          </div>
          <div>
            <Board
              state={displayState}
              onMove={handleMove}
              flipped={flipped}
              lastMove={displayLastMove}
              bestMoveSqs={bestMvSqsDisplay}
            />
            {gameMsg && <div className="game-msg">{gameMsg}</div>}
            <div className="board-controls">
              {['⟪', '←', '→', '⟫'].map((ic, i) => (
                <button key={ic} className="btn" onClick={() => navigate([-999, -1, 1, 999][i])}>{ic}</button>
              ))}
              <button className="btn" onClick={() => setFlipped((f) => !f)}>⇅ Flip</button>
              <button className="btn btn-danger" onClick={newGame}>New Game</button>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="right-panel">

          {/* Mode */}
          <div className="panel">
            <div className="panel-label">Mode</div>
            <div className="row gap-4 mb-10">
              {[['analysis', 'Analysis'], ['play', 'Play vs Engine']].map(([m, label]) => (
                <button key={m} className={`btn flex-1${mode === m ? ' btn-active' : ''}`} onClick={() => { setMode(m); setPgn(null); }}>{label}</button>
              ))}
            </div>
            {mode === 'play' && (
              <div className="row gap-4 mb-10">
                <span className="muted" style={{ alignSelf: 'center' }}>Play as:</span>
                {[['w', '♔ White'], ['b', '♚ Black']].map(([c, label]) => (
                  <button key={c} className={`btn flex-1${playerColor === c ? ' btn-active' : ''}`} onClick={() => { setPlayerColor(c); setFlipped(c === 'b'); }}>{label}</button>
                ))}
              </div>
            )}
            <div className="row gap-8 mb-10" style={{ alignItems: 'center' }}>
              <span className="muted">Depth:</span>
              <input type="range" min={1} max={25} step={1} value={depth} onChange={(e) => setDepth(+e.target.value)} style={{ flex: 1 }} />
              <span className="mono">{depth}</span>
            </div>
            <div className="row gap-6">
              <button className="btn flex-1" onClick={() => engine.analyze(toFEN(displayState), depth)} disabled={!engine.connected}>
                {engine.thinking ? 'Thinking…' : 'Analyze'}
              </button>
              <button className="btn btn-danger" onClick={engine.stop} disabled={!engine.connected || !engine.thinking}>■ Stop</button>
            </div>
          </div>

          {/* Engine output */}
          <div className="panel">
            <div className="panel-label">Engine output</div>
            <div className="engine-summary">
              <div>
                <div className="muted" style={{ fontSize: 10 }}>Evaluation</div>
                <div className="eval-big" style={{ color: evalColor }}>{engine.connected ? evalLabel : '—'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="muted" style={{ fontSize: 10 }}>Best move</div>
                <div className="mono" style={{ fontSize: 15, color: 'var(--color-text-info)' }}>{engine.connected && engine.bestMove ? engine.bestMove : '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted" style={{ fontSize: 10 }}>Depth</div>
                <div className="mono" style={{ fontSize: 15 }}>{engine.connected ? engine.depth : '—'}</div>
              </div>
            </div>
            <div className="pv-lines">
              {engine.lines.map((l, i) => (
                <div key={i} className="pv-row">
                  <span style={{ color: 'var(--color-text-info)' }}>d{l.depth}</span>
                  <span style={{ color: l.isMate ? 'var(--color-text-warning)' : l.eval >= 0 ? 'var(--color-text-success)' : 'var(--color-text-danger)', minWidth: 44 }}>
                    {l.isMate ? `M${l.mateIn}` : (l.eval?.toFixed(2) ?? '0.00')}
                  </span>
                  <span className="pv-moves">{l.pv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Move history */}
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', minHeight: 120, maxHeight: 180 }}>
            <div className="panel-label">Move history</div>
            <MoveHistory
              history={pgn ? pgn.positions.slice(1).map((p) => ({ san: p.san })) : history}
              currentIdx={pgn ? pgn.curIdx - 1 : histIdx}
              onJump={(idx) => {
                if (pgn) setPgn((p) => ({ ...p, curIdx: idx + 1 }));
                else setHistIdx(idx);
              }}
            />
          </div>

          {/* PGN */}
          <div className="panel">
            <div className="panel-label">PGN analysis</div>
            <label className="pgn-drop">
              📂 Upload .pgn file
              <input type="file" accept=".pgn,.txt" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => handlePGNLoad(ev.target.result); r.readAsText(f); }} />
            </label>
            {pgn && (
              <div style={{ marginTop: 8 }}>
                <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
                  <strong>{pgn.headers.White || '?'}</strong> vs <strong>{pgn.headers.Black || '?'}</strong>
                  {pgn.headers.Result && <span style={{ marginLeft: 8 }}>{pgn.headers.Result}</span>}
                  {pgn.headers.Date && <span style={{ marginLeft: 8, opacity: 0.7 }}>{pgn.headers.Date}</span>}
                </div>
                <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
                  Move <span style={{ color: 'var(--color-text-info)', fontFamily: 'monospace' }}>{pgn.curIdx}</span> / {pgn.positions.length - 1}
                </div>
                <div className="pgn-moves">
                  {pgn.positions.slice(1).map((pos, i) => (
                    <button
                      key={i}
                      className={`btn pgn-move-btn${pgn.curIdx === i + 1 ? ' btn-active' : ''}`}
                      onClick={() => setPgn((p) => ({ ...p, curIdx: i + 1 }))}
                    >
                      {Math.ceil((i + 1) / 2)}{i % 2 === 0 ? '.' : '…'}{pos.san}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Connection */}
          <div className="panel">
            <div className="panel-label">Engine connection</div>
            <div className="row gap-6">
              <input type="text" value={wsInput} onChange={(e) => setWsInput(e.target.value)} placeholder="ws://localhost:8080" style={{ flex: 1 }} />
              <button className="btn" style={{ whiteSpace: 'nowrap' }} onClick={() => { setWsUrl(wsInput); setTimeout(engine.connect, 50); }}>
                {engine.connected ? 'Reconnect' : 'Connect'}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 4, fontSize: 10 }}>Start <code>node bridge/server.js</code> first, then click Connect.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
