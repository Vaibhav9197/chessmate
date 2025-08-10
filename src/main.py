import chess
import chess.engine

# Full path to your Stockfish executable
STOCKFISH_PATH = r"C:\Users\3mbhi\OneDrive\Desktop\chessmate-ai\stockfish\stockfish-windows-x86-64-avx2.exe"

# Start Stockfish
engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)

# Create a new chess board
board = chess.Board()

# Ask Stockfish for the best move in 1 second search time
result = engine.play(board, chess.engine.Limit(time=1.0))

print("Best move from Stockfish:", result.move)

# Close the engine
engine.quit()
