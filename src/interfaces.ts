export enum Player {
    Laranja = 'Laranja',
    Azul = 'Azul',
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
    type: 'colocar' | 'mover'; 
    piece: Piece;
    to: { row: number; col: number };
    from?: { row: number; col: number };
}