export enum Player {
    Orange = 'Orange',
    Blue = 'Blue',
}

export enum PieceSize {
    Small = 1,
    Medium = 2,
    Large = 3,
}

export interface Piece {
    owner: Player;
    size: PieceSize;
}

export type Square = Piece[];

export interface Move {
    type: 'place' | 'move'; //place coloca a peça no tabuleiro, move move uma peça
    piece: Piece;
    to: { row: number; col: number };
    from?: { row: number; col: number };
}