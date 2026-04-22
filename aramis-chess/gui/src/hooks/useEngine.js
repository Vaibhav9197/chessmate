import { useState, useRef, useCallback, useEffect } from 'react';
import { parseEngineInfo } from '../logic/uci';

export function useEngine(wsUrl) {
  const [connected, setConnected] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [evalCp, setEvalCp] = useState(0);
  const [isMate, setIsMate] = useState(false);
  const [mateIn, setMateIn] = useState(null);
  const [bestMove, setBestMove] = useState(null);
  const [depth, setDepthVal] = useState(0);
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('');
  const wsRef = useRef(null);
  const onBestMoveRef = useRef(null);

  const handleLine = useCallback((line) => {
    if (line.startsWith('info depth')) {
      const info = parseEngineInfo(line);
      if (info.depth !== undefined) setDepthVal(info.depth);
      if (info.eval !== undefined) { setEvalCp(info.eval); setIsMate(false); }
      if (info.mateIn !== undefined) { setMateIn(info.mateIn); setIsMate(true); }
      if (info.pv) {
        setBestMove(info.pv[0]);
        setLines((prev) => [
          { depth: info.depth || 0, eval: info.eval || 0, isMate: info.isMate, mateIn: info.mateIn, pv: info.pv.slice(0, 5).join(' ') },
          ...prev.slice(0, 4),
        ]);
      }
      setThinking(true);
    } else if (line.startsWith('bestmove')) {
      const bm = line.match(/bestmove (\S+)/);
      if (bm) {
        setBestMove(bm[1]);
        if (onBestMoveRef.current) { onBestMoveRef.current(bm[1]); onBestMoveRef.current = null; }
      }
      setThinking(false);
    } else if (line.includes('uciok')) {
      setStatus('Engine ready');
    }
  }, []);

  const send = useCallback((cmd) => {
    if (wsRef.current?.readyState === 1) wsRef.current.send(cmd);
  }, []);

  const connect = useCallback(() => {
    try {
      if (wsRef.current) wsRef.current.close();
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setConnected(true);
        setStatus('Connecting…');
        ws.send('uci');
        ws.send('isready');
      };
      ws.onmessage = (e) => handleLine(e.data);
      ws.onclose = () => { setConnected(false); setStatus('Disconnected'); };
      ws.onerror = () => { setConnected(false); setStatus('Connection failed — is the bridge running?'); };
      wsRef.current = ws;
    } catch {
      setConnected(false);
      setStatus('Invalid WebSocket URL');
    }
  }, [wsUrl, handleLine]);

  const analyze = useCallback((fen, searchDepth) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    setLines([]);
    setBestMove(null);
    setThinking(true);
    send('stop');
    send(`position fen ${fen}`);
    send(`go depth ${searchDepth}`);
  }, [send]);

  const playMove = useCallback((fen, searchDepth, onDone) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    setLines([]);
    setBestMove(null);
    setThinking(true);
    onBestMoveRef.current = onDone;
    send('stop');
    send(`position fen ${fen}`);
    send(`go depth ${searchDepth}`);
  }, [send]);

  const stop = useCallback(() => { send('stop'); setThinking(false); }, [send]);

  const newGame = useCallback(() => {
    send('stop');
    send('ucinewgame');
    setLines([]);
    setBestMove(null);
    setThinking(false);
    setEvalCp(0);
    setIsMate(false);
    setDepthVal(0);
  }, [send]);

  return { connected, thinking, evalCp, isMate, mateIn, bestMove, depth, lines, status, connect, analyze, playMove, stop, newGame };
}
