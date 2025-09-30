import { Board } from './tabuleiro';
import { Move, Player } from './interfaces';
import { evaluateBoard } from './heuristica';

const MAX_DEPTH = 5; // Profundidade da busca Minimax

export function findBestMove(board: Board, player: Player): Move | null {
    console.log(`\nIA (${player}) está pensando com profundidade ${MAX_DEPTH}...`);
    const startTime = Date.now();

    const { move } = negamax(board, MAX_DEPTH, -Infinity, Infinity, player, player);

    const endTime = Date.now();
    console.log(`IA decidiu em ${(endTime - startTime) / 1000} segundos.`);

    return move;
}

function negamax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    currentPlayer: Player,
    perspectivePlayer: Player
): { score: number; move: Move | null } {
    const winner = board.checkWinner();
    if (depth === 0 || winner) {
        const score = evaluateBoard(board, perspectivePlayer);
        const perspectiveSign = currentPlayer === perspectivePlayer ? 1 : -1;
        return { score: score * perspectiveSign, move: null };
    }

    let bestMove: Move | null = null;
    let bestScore = -Infinity;

    const validMoves = board.getValidMoves(currentPlayer);

    for (const move of validMoves) {
        const newBoard = board.applyMove(move);
        const nextPlayer = currentPlayer === Player.Orange ? Player.Blue : Player.Orange;

        const result = negamax(newBoard, depth - 1, -beta, -alpha, nextPlayer, perspectivePlayer);
        const currentScore = -result.score;

        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestMove = move;
        }

        alpha = Math.max(alpha, bestScore);

        if (alpha >= beta) {
            break; // Poda
        }
    }

    return { score: bestScore, move: bestMove };
}
