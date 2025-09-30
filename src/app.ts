import { Board } from './tabuleiro';
import { Player, Piece, PieceSize, Move } from './interfaces';
import { findBestMove } from './minmax';
import * as readlineSync from 'readline-sync';

export class GameController {
    private board: Board;
    private currentPlayer: Player;
    private humanPlayer: Player;
    private aiPlayer: Player;

    constructor() {
        this.board = new Board();
        this.currentPlayer = Player.Laranja;
        this.humanPlayer = Player.Laranja;
        this.aiPlayer = Player.Azul;
    }

    public async startGame() {
        console.log("====================== Bem-vindo ao Nhac Nhac! ======================"); // Limpa o console
        this.setupPlayers();

        while (!this.board.checkWinner()) {
            this.printBoard();
            const coloredPlayer = this.colorize(this.currentPlayer, this.currentPlayer);
            console.log(`\n================ Turno do jogador: ${coloredPlayer} ================`);


            let move: Move | null = null;
            if (this.currentPlayer === this.humanPlayer) {
                move = this.getHumanMove();
            } else {
                move = findBestMove(this.board, this.aiPlayer);
            }

            if (move) {
                this.board = this.board.applyMove(move);
                this.logMove(move);
            } else {
                console.log("Nenhuma jogada válida encontrada. O jogo terminou em empate?");
                break;
            }

            this.currentPlayer = (this.currentPlayer === Player.Laranja) ? Player.Azul : Player.Laranja;
        }

        this.printBoard();
        const winner = this.board.checkWinner();
        if(winner){
            const coloredWinner = this.colorize(winner, winner);
            console.log(`\nFim de jogo! Vencedor: ${coloredWinner}`);
        }
    }

    private setupPlayers() {
        const humanColor = readlineSync.question('Você quer ser Laranja (L) ou Azul (A)? ').toUpperCase();
        if (humanColor === 'A' || humanColor === 'AZUL') {
            this.humanPlayer = Player.Azul;
            this.aiPlayer = Player.Laranja;
        } else {
            this.humanPlayer = Player.Laranja;
            this.aiPlayer = Player.Azul;
        }

        const whoStarts = readlineSync.question('Quem começa? (H)umano ou (I)A? ').toUpperCase();
        this.currentPlayer = (whoStarts === 'I' || whoStarts === 'A') ? this.aiPlayer : this.humanPlayer;
    }

    private getHumanMove(): Move {
        const validMoves = this.board.getValidMoves(this.humanPlayer);
        while (true) {
            const input = readlineSync.question(`Sua jogada (ex: 'colocar G em A2' ou 'mover A1 para C3'): `).toLowerCase();
            const move = this.parseMove(input, validMoves);
            if (move) {
                return move;
            }
            console.log("Jogada inválida. Tente novamente.");
        }
    }

    private parseMove(input: string, validMoves: Move[]): Move | null {
        const placeRegex = /colocar\s+([gmp])\s+em\s+([a-c])([1-3])/; //regex para o mano não colocar errado
        const moveRegex = /mover\s+([a-c])([1-3])\s+para\s+([a-c])([1-3])/;  //regex para o mano não mover errado

        const placeMatch = input.match(placeRegex);
        if (placeMatch) {
            const size = this.parseSize(placeMatch[1]);
            const to = this.parseCoords(placeMatch[2], placeMatch[3]);
            return validMoves.find(m =>
                m.type === 'colocar' &&
                m.piece.size === size &&
                m.to.row === to.row && m.to.col === to.col
            ) || null;
        }

        const moveMatch = input.match(moveRegex);
        if (moveMatch) {
            const from = this.parseCoords(moveMatch[1], moveMatch[2]);
            const to = this.parseCoords(moveMatch[3], moveMatch[4]);
            return validMoves.find(m =>
                m.type === 'mover' &&
                m.from?.row === from.row && m.from?.col === from.col &&
                m.to.row === to.row && m.to.col === to.col
            ) || null;
        }

        return null;
    }

    private parseSize(s: string): PieceSize {
        if (s === 'p') return PieceSize.Small;
        if (s === 'm') return PieceSize.Medium;
        return PieceSize.Large;
    }

    private parseCoords(colStr: string, rowStr: string): { row: number; col: number } {
        const row = parseInt(rowStr, 10) - 1;
        const col = colStr.charCodeAt(0) - 'a'.charCodeAt(0);
        return { row, col };
    }

    private formatCoords(row: number, col: number): string {
        return `${String.fromCharCode('A'.charCodeAt(0) + col)}${row + 1}`;
    }

    private colorize(text: string, player: Player): string {
        const orange = '\x1b[38;5;208m'; // Código para pintar de laranja
        const blue = '\x1b[34m';         // Código para pintar de azul
        const reset = '\x1b[0m';         // Reseta a cor

        if (player === Player.Laranja) {
            return `${orange}${text}${reset}`;
        } else {
            return `${blue}${text}${reset}`;
        }
    }

    private logMove(move: Move) {
        const player = move.piece.owner;
        const sizeChar = {
            [PieceSize.Small]: 'P',
            [PieceSize.Medium]: 'M',
            [PieceSize.Large]: 'G'
        }[move.piece.size];
        const toCoords = this.formatCoords(move.to.row, move.to.col);
        const coloredPlayer = this.colorize(player, player);

        if (move.type === 'colocar') {
            console.log(`> ${coloredPlayer} colocou uma peça ${sizeChar} em ${toCoords}.`);
        } else if (move.from) {
            const fromCoords = this.formatCoords(move.from.row, move.from.col);
            console.log(`> ${coloredPlayer} moveu a peça ${sizeChar} de ${fromCoords} para ${toCoords}.`);
        }
    }

    private printBoard() {
        console.log("\nPeças disponíveis:");
        for (const player of [Player.Laranja, Player.Azul]) {
            const pieces = this.board.offBoardPieces[player];
            const counts = { P: 0, M: 0, G: 0 };
            pieces.forEach((p: Piece) => {
                if (p.size === PieceSize.Small) counts.P++;
                else if (p.size === PieceSize.Medium) counts.M++;
                else counts.G++;
            });
            const coloredPlayer = this.colorize(player, player)
            console.log(`${coloredPlayer}: P(${counts.P}), M(${counts.M}), G(${counts.G})`);
        }

        console.log("\n  A   B   C");
        for (let r = 0; r < 3; r++) {
            let rowStr = `${r + 1} `;
            for (let c = 0; c < 3; c++) {
                const piece = this.board.getTopPiece(r, c);
                if (piece) {
                    const sizeChar = {
                        [PieceSize.Small]: 'P',
                        [PieceSize.Medium]: 'M',
                        [PieceSize.Large]: 'G'
                    }[piece.size];
                    const textToColor = `[${sizeChar}]`;
                    const coloredPiece = this.colorize(textToColor, piece.owner)
                    rowStr += coloredPiece;
                } else {
                    rowStr += `[ ]`;
                }
            }
            console.log(rowStr);
        }
    }
}