// Contract between client and "server".
// In a real studio this would be the RGS API (JSON over HTTP/WebSocket).
// All money values are integers in cents to avoid floating point errors.

export type SymbolId =
  | 'TEN' | 'J' | 'Q' | 'K' | 'A' // low pays
  | 'STAR' | 'SEVEN'             // high pays
  | 'WILD'                       // substitutes everything except SCATTER
  | 'SCATTER';                   // pays/triggers anywhere

/** matrix[reel][row], row 0 = top */
export type Matrix = SymbolId[][];

export interface Position {
  reel: number;
  row: number;
}

export interface LineWin {
  lineIndex: number;
  symbol: SymbolId;
  count: number;
  amount: number;
  positions: Position[];
}

export interface InitResponse {
  balance: number;
  bets: number[];
  defaultBet: number;
  matrix: Matrix;
}

export interface SpinResponse {
  matrix: Matrix;
  wins: LineWin[];
  totalWin: number;
  balance: number;
  scatterPositions: Position[];
  /** > 0 when 3+ scatters landed. Client side of free spins is a TODO (step 8). */
  freeSpinsWon: number;
}

export type ServerErrorCode = 'INVALID_BET' | 'INSUFFICIENT_FUNDS';

export class ServerError extends Error {
  constructor(public readonly code: ServerErrorCode) {
    super(code);
    this.name = 'ServerError';
  }
}
