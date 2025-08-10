import chess
import chess.pgn
import os

# Configuration

player_name = "timonix"
engine_path = "/usr/games/stockfish"
max_depth = 5
max_time = 0.01
blunder_thresh = -150
pgn_file_path = "pgn/example-1.pgn"
possible = 5


def get_best_variations(board, engine, max_time, max_depth, move, current_depth=0):
    # Make the move on the board
    board.push(move)

    # Analyze the position with the engine
    response = engine.analyse(
        board, chess.engine.Limit(time=max_time, depth=max_depth))

    # Get the best variations for the move
    best_variations = response["pv"]

    # If the best variations are legal moves and we haven't reached the maximum depth, recursively call the function on the variations
    if current_depth < max_depth:
        new_variations = []
        for variation in best_variations:
            if board.is_legal(variation):
                new_variations.extend(get_best_variations(
                    board, engine, max_time, max_depth, variation, current_depth + 1))
        best_variations = new_variations

    # Undo the move on the board
    board.pop()

    return best_variations


# separate the games to analyse
games = []
with open(pgn_file_path, 'r') as f:
    game = chess.pgn.read_game(f)
    while game is not None:
        if game.headers['Black'] == player_name or game.headers['White'] == player_name:
            board = game.board()
            moves_played_by_player = []
            for move in game.mainline_moves():
                if board.turn == chess.WHITE and game.headers['White'] == player_name:
                    board.push(move)
                    moves_played_by_player.append(move)
                elif board.turn == chess.BLACK and game.headers['Black'] == player_name:
                    moves_played_by_player.append(move)
                    board.push(move)
                else:
                    board.push(move)
            new_game = chess.pgn.Game.from_board(board)
            new_game.headers = game.headers.copy()
            new_game.headers["Result"] = "*"
            games.append(new_game)
        game = chess.pgn.read_game(f)

# turn on the engine
engine = chess.engine.SimpleEngine.popen_uci(engine_path)

# search the games for blunders
for game in games:
    blunders = []
    board = game.board()
    print("Current Game: ", game.headers['Event'], game.headers['Site'], "\n")
    for move in game.mainline():
        move_string = move.move.uci()
        move = chess.Move.from_uci(move_string)
        board.push(move)
        info = engine.analyse(board, chess.engine.Limit(time=max_time))
        score = info["score"].relative.score()
        if score is not None and score <= blunder_thresh:
            blunders.append((board.fen(), move.uci(), score))

    directory_path = f"{player_name}'s blunders/{game.headers['Event']}/"
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    print(
        f"Writing blunders for {player_name}'s game: {game.headers['Event']}")
    with open(f"{directory_path}/blunder_list.txt", "w", encoding="utf-8") as f:
        for blunder in blunders:
            f.write(str(blunder) + "\n")

    # create a new game
    new_game = chess.pgn.Game()

    # create a root node representing the initial position
    root_node = new_game.add_variation(chess.Move.null())

    i = 1  # counter for the progress

    for fen, blunder, score in blunders:
        # create a variation tree for the root node
        board = chess.Board(fen)

        response = None
        for move in engine.analyse(board, chess.engine.Limit(time=3))['pv']:
            if board.is_legal(move):
                response = move
                break

        if response is None:
            raise Exception("No legal move found")

        # print("The response is: ", response, "\n")
        e2_variations = get_best_variations(
            board, engine, max_time, max_depth, response, possible)

        # print(e2_variations)

        game = chess.pgn.Game()
        board = chess.Board(fen)
        game.setup(board)

        # Add the initial position to the game
        node = game.add_variation(response)
        board.push(response)

        # Add the variations to the game
        for variation in e2_variations:
            # Add the subsequent moves to the variation
            if board.is_legal(variation):
                # Create a new variation as a child of the mainline node
                child_node = node.add_variation(variation)
                board.push(variation)
                # Update the current node to the child node
                node = child_node
            else:
                continue

        # Save the game to a PGN file
        print(f"Writing moves for blunder: {blunder} ({i}/{len(blunders)})")
        with open(f"{directory_path}/{blunder}.pgn", "w", encoding="utf-8") as f:
            exporter = chess.pgn.FileExporter(f)
            game.accept(exporter)

        i = i + 1  # update the counter

    new_game = chess.pgn.Game()  # create a new game object for the next iteration


engine.close()
