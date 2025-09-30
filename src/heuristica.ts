import { Board } from './tabuleiro';
import { Player, PieceSize } from './interfaces';

const WIN_SCORE = 10000;
const TWO_IN_A_ROW_SCORE = 100;
const ONE_IN_A_ROW_SCORE = 10;
const CENTER_CONTROL_SCORE = 25;
const CORNER_CONTROL_SCORE = 15;
const PIECE_POWER_MULTIPLIER = {
    [PieceSize.Large]: 9,
    [PieceSize.Medium]: 4,
    [PieceSize.Small]: 1,
};
const TRAPPED_PIECE_BONUS = 20;
const REVEAL_THREAT_PENALTY = -200;

export function evaluateBoard(board: Board, perspectivePlayer: Player): number {
    const opponent = perspectivePlayer === Player.Orange ? Player.Blue : Player.Orange;
    const winner = board.checkWinner();
    if (winner) {
        return winner === perspectivePlayer ? WIN_SCORE : -WIN_SCORE;
    }

    let score = 0;
    score += evaluateLines(board, perspectivePlayer, opponent);
    score += evaluatePositionalControl(board, perspectivePlayer, opponent);
    score += evaluatePiecePower(board, perspectivePlayer, opponent);
    score += evaluateHiddenState(board, perspectivePlayer, opponent);

    return score;
}

function evaluateLines(board: Board, player: Player, opponent: Player): number {
    let lineScore = 0;
    const lines = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]],
    ];

    for (const line of lines) {
        let playerCount = 0;
        let opponentCount = 0;
        for (const [r, c] of line) {
            const piece = board.getTopPiece(r, c);
            if (piece) {
                if (piece.owner === player) playerCount++;
                else opponentCount++;
            }
        }

        if (playerCount > 0 && opponentCount === 0) {
            if (playerCount === 2) lineScore += TWO_IN_A_ROW_SCORE;
            else if (playerCount === 1) lineScore += ONE_IN_A_ROW_SCORE;
        } else if (opponentCount > 0 && playerCount === 0) {
            if (opponentCount === 2) lineScore -= TWO_IN_A_ROW_SCORE;
            else if (opponentCount === 1) lineScore -= ONE_IN_A_ROW_SCORE;
        }
    }
    return lineScore;
}

function evaluatePositionalControl(board: Board, player: Player, opponent: Player): number {
    let positionalScore = 0;
    const positions = {
        center: [[1, 1]],
        corners: [[0, 0], [0, 2], [2, 0], [2, 2]],
    };

    for (const [r, c] of positions.center) {
        const piece = board.getTopPiece(r, c);
        if (piece) {
            positionalScore += (piece.owner === player ? 1 : -1) * CENTER_CONTROL_SCORE;
        }
    }
    for (const [r, c] of positions.corners) {
        const piece = board.getTopPiece(r, c);
        if (piece) {
            positionalScore += (piece.owner === player ? 1 : -1) * CORNER_CONTROL_SCORE;
        }
    }
    return positionalScore;
}

function evaluatePiecePower(board: Board, player: Player, opponent: Player): number {
    let pieceScore = 0;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const piece = board.getTopPiece(r, c);
            if (piece) {
                const power = PIECE_POWER_MULTIPLIER[piece.size];
                pieceScore += (piece.owner === player ? 1 : -1) * power;
            }
        }
    }
    return pieceScore;
}

function evaluateHiddenState(board: Board, player: Player, opponent: Player): number {
    let hiddenStateScore = 0;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const stack = board.grid[r][c];
            if (stack.length > 1) {
                const topPiece = stack[stack.length - 1];
                const hiddenPiece = stack[stack.length - 2];

                // Cenário Positivo: Aprisionando peça do oponente
                if (topPiece.owner === player && hiddenPiece.owner === opponent) {
                    hiddenStateScore += TRAPPED_PIECE_BONUS;
                }
                // Cenário Negativo: Risco de revelar uma ameaça do oponente
                if (topPiece.owner === player && hiddenPiece.owner === opponent) {
                    const tempBoard = board.clone();
                    tempBoard.grid[r][c].pop(); // Simula a revelação
                    if (tempBoard.checkWinner() === opponent) {
                        hiddenStateScore += REVEAL_THREAT_PENALTY * 10; // Penalidade máxima
                    } else {
                        const opponentThreats = countThreats(tempBoard, opponent);
                        if (opponentThreats > 0) {
                            hiddenStateScore += REVEAL_THREAT_PENALTY;
                        }
                    }
                }
            }
        }
    }
    return hiddenStateScore;
}

function countThreats(board: Board, player: Player): number {
    let threats = 0;
    const opponent = player === Player.Orange ? Player.Blue : Player.Orange;
    const lines = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]],
    ];
    for (const line of lines) {
        let playerCount = 0;
        let opponentCount = 0;
        for (const [r, c] of line) {
            const piece = board.getTopPiece(r, c);
            if (piece) {
                if (piece.owner === player) playerCount++;
                else opponentCount++;
            }
        }
        if (playerCount === 2 && opponentCount === 0) {
            threats++;
        }
    }
    return threats;
}