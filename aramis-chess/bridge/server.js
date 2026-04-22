const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const path = require('path');

// ── Change this to your Aramis engine path ──
const ENGINE_PATH = path.join(__dirname, '..', 'engine', 'build', 'ChessEngine.exe');
// Windows users: '../engine/ChessEngine.exe'

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });
console.log(`Aramis bridge running on ws://localhost:${PORT}`);
console.log(`Engine path: ${ENGINE_PATH}\n`);

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[+] GUI connected from ${ip}`);

const engine = spawn(ENGINE_PATH, [], { stdio: ['pipe','pipe','pipe'], shell: true });

  engine.on('error', (err) => {
    console.error('[engine error]', err.message);
    ws.send(`info string ENGINE ERROR: ${err.message}`);
    ws.close();
  });

  // Engine stdout → WebSocket (line by line)
  let buffer = '';
  engine.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        console.log(`[engine → GUI] ${trimmed}`);
        if (ws.readyState === 1) ws.send(trimmed);
      }
    }
  });

  engine.stderr.on('data', (d) => console.error('[engine stderr]', d.toString()));

  engine.on('close', (code) => {
    console.log(`[engine] exited with code ${code}`);
    if (ws.readyState === 1) ws.close();
  });

  // WebSocket → Engine stdin
  ws.on('message', (msg) => {
    const cmd = msg.toString().trim();
    console.log(`[GUI → engine] ${cmd}`);
    if (engine.stdin.writable) engine.stdin.write(cmd + '\n');
  });

  ws.on('close', () => {
    console.log(`[-] GUI disconnected`);
    if (engine.stdin.writable) engine.stdin.write('quit\n');
    setTimeout(() => engine.kill(), 500);
  });

  ws.on('error', (err) => console.error('[ws error]', err.message));
});

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Kill the old process and retry.`);
  else console.error('[server error]', err);
});
