#!/bin/bash
set -e

echo "============================="
echo "   Aramis Chess GUI Launcher "
echo "============================="

# Start bridge
echo ""
echo "[1/2] Starting WebSocket bridge..."
cd "$(dirname "$0")/bridge"
node server.js &
BRIDGE_PID=$!
echo "      Bridge PID: $BRIDGE_PID"
sleep 1

# Start React GUI
echo ""
echo "[2/2] Starting React GUI..."
cd "../gui"
npm start &
GUI_PID=$!

echo ""
echo "      Bridge: ws://localhost:8080"
echo "      GUI:    http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop everything."

# Kill both on exit
trap "echo ''; echo 'Shutting down...'; kill $BRIDGE_PID $GUI_PID 2>/dev/null; exit 0" INT TERM

wait
