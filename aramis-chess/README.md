# Aramis Chess GUI

React-based GUI for the Aramis chess engine. Built from scratch — no external chess libraries.

## Quick Start

### 1. Install dependencies

```bash
# Bridge
cd bridge && npm install

# React GUI
cd ../gui && npm install
```

### 2. Set engine path

Edit `bridge/server.js` line 6:
```js
const ENGINE_PATH = path.join(__dirname, '..', 'engine', 'ChessEngine');
// Windows: '../engine/ChessEngine.exe'
```

### 3. Run everything

```bash
chmod +x start.sh
./start.sh
```

Or manually in two terminals:
```bash
# Terminal 1
cd bridge && node server.js

# Terminal 2
cd gui && npm start
```

### 4. Open browser
Go to http://localhost:3000, click **Connect** in the Engine Connection panel.

## Project Structure

```
aramis-chess/
├── engine/          ← Your compiled Aramis binary
├── bridge/          ← Node.js WebSocket ↔ engine bridge
│   └── server.js
├── gui/             ← React frontend
│   └── src/
│       ├── logic/   ← Chess rules (no external libs)
│       ├── hooks/   ← Engine WebSocket hook
│       └── components/
├── start.sh
└── README.md
```

## Features
- Drag & drop chessboard
- Play vs Aramis engine
- Analysis mode with evaluation bar
- PGN file upload and navigation
- Move history with click-to-navigate
- Engine depth control
- Best move highlighting
