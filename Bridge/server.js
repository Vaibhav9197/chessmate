const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');

// ← Change this to your actual engine path
const ENGINE_PATH = 'C:/Users/mishr/OneDrive/Desktop/chessmateai/Chess-Engine-in-cpp/engine/build/ChessEngine.exe';

const wss = new WebSocketServer({ port: 8080 });
console.log('Bridge running on ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('GUI connected');

  const engine = spawn(ENGINE_PATH);

  // Engine → GUI
  engine.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log('[engine →]', line.trim());
        ws.send(line.trim());
      }
    });
  });

  engine.stderr.on('data', (d) => console.error('[engine err]', d.toString()));
  engine.on('close', () => { console.log('Engine exited'); ws.close(); });

  // GUI → Engine
  ws.on('message', (msg) => {
    const cmd = msg.toString().trim();
    console.log('[GUI →]', cmd);
    engine.stdin.write(cmd + '\n');
  });

  ws.on('close', () => {
    engine.stdin.write('quit\n');
    engine.kill();
  });
});