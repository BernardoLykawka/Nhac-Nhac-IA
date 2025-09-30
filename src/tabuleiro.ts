import { Player, Piece, PieceSize, Square, Move } from './interfaces';

export class Board {
    public grid: Square[][];
    public offBoardPieces: Record<Player, Piece[]>;

    constructor() {
        this.grid = Array(3)
            .fill(null)
            .map(() => Array(3).fill(null).map(() => []));
        this.offBoardPieces = {
            [Player.Laranja]: this.createPlayerPieces(Player.Laranja),
            [Player.Azul]: this.createPlayerPieces(Player.Azul),
        };
    }

    private createPlayerPieces(player: Player): Piece[] {
        const pieces: Piece[] = [];
        for (let i = 0; i < 2; i++) {
            pieces.push({ owner: player, size: PieceSize.Small });
            pieces.push({ owner: player, size: PieceSize.Medium });
            pieces.push({ owner: player, size: PieceSize.Large });
        }
        return pieces;
    }

    public getTopPiece(row: number, col: number): Piece | null {
        const stack = this.grid[row][col];
        return stack.length > 0 ? stack[stack.length - 1] : null;
    }

    public getValidMoves(player: Player): Move[] {
        const moves: Move[] = [];

        // 1. Movimentos de posicionar peças de fora do tabuleiro
        const uniqueOffBoardPieces = this.getUniquePieces(this.offBoardPieces[player]);
        for (const piece of uniqueOffBoardPieces) {
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const topPiece = this.getTopPiece(r, c);
                    if (!topPiece || piece.size > topPiece.size) {
                        moves.push({ type: 'colocar', piece, to: { row: r, col: c } });
                    }
                }
            }
        }

        // 2. Movimentos de deslocar peças já no tabuleiro
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const topPiece = this.getTopPiece(r, c);
                if (topPiece && topPiece.owner === player) {
                    for (let tr = 0; tr < 3; tr++) {
                        for (let tc = 0; tc < 3; tc++) {
                            if (r === tr && c === tc) continue;
                            const targetTopPiece = this.getTopPiece(tr, tc);
                            if (!targetTopPiece || topPiece.size > targetTopPiece.size) {
                                moves.push({
                                    type: 'mover',
                                    piece: topPiece,
                                    from: { row: r, col: c },
                                    to: { row: tr, col: tc },
                                });
                            }
                        }
                    }
                }
            }
        }
        return moves;
    }

    public applyMove(move: Move): Board {
        const newBoard = this.clone();
        const player = move.piece.owner;

        if (move.type === 'colocar') {
            const pieceIndex = newBoard.offBoardPieces[player].findIndex(
                (p) => p.size === move.piece.size
            );
            if (pieceIndex > -1) {
                newBoard.offBoardPieces[player].splice(pieceIndex, 1);
            }
            newBoard.grid[move.to.row][move.to.col].push(move.piece);
        } else if (move.type === 'mover' && move.from) {
            const pieceToMove = newBoard.grid[move.from.row][move.from.col].pop();
            if (pieceToMove) {
                newBoard.grid[move.to.row][move.to.col].push(pieceToMove);
            }
        }
        return newBoard;
    }

    public checkWinner(): Player | null {
        const lines = [
            // Horizontais
            [[0, 0], [0, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2]],
            [[2, 0], [2, 1], [2, 2]],
            // Verticais
            [[0, 0], [1, 0], [2, 0]],
            [[0, 1], [1, 1], [2, 1]],
            [[0, 2], [1, 2], [2, 2]],
            // Diagonais
            [[0, 0], [1, 1], [2, 2]],
            [[0, 2], [1, 1], [2, 0]],
        ];

        for (const line of lines) {
            const pieces = line.map(([r, c]) => this.getTopPiece(r, c));
            if (pieces[0] && pieces.every((p) => p && p.owner === pieces[0]?.owner)) {
                return pieces[0]?.owner || null;
            }
        }
        return null;
    }

    public clone(): Board {
        const newBoard = new Board();
        newBoard.grid = JSON.parse(JSON.stringify(this.grid));
        newBoard.offBoardPieces = JSON.parse(JSON.stringify(this.offBoardPieces));
        return newBoard;
    }

    private getUniquePieces(pieces: Piece[]): Piece[] {
        const seen = new Set<PieceSize>();
        return pieces.filter((p) => {
            if (seen.has(p.size)) {
                return false;
            }
            seen.add(p.size);
            return true;
        });
    }
}