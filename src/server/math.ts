// Pure game math: no I/O, no timers, no globals.
// The mock server and the RTP simulation both use these functions,
// so whatever you measure with `npm run rtp` is exactly what the game pays.

import {
  FREE_SPINS_AWARD, LINES, PAYTABLE, REEL_STRIPS, ROWS, SCATTERS_FOR_FREE_SPINS,
} from './config';
import type { LineWin, Matrix, Position, SymbolId } from './types';

export type Rng = () => number;

/** Pick a random stop on each strip and read ROWS symbols from it. */
export function spinReels(rng: Rng): Matrix {
  return REEL_STRIPS.map((strip) => {
    const stop = Math.floor(rng() * strip.length);
    const column: SymbolId[] = [];
    for (let row = 0; row < ROWS; row++) {
      column.push(strip[(stop + row) % strip.length]);
    }
    return column;
  });
}

function pay(symbol: SymbolId, count: number): number {
  if (count < 3) return 0;
  return PAYTABLE[symbol]?.[Math.min(count, 5) as 3 | 4 | 5] ?? 0;
}

/** Evaluate one payline, left to right, with WILD substitution. */
function evaluateLine(matrix: Matrix, lineIndex: number, lineBet: number): LineWin | null {
  const rows = LINES[lineIndex];
  const symbols = rows.map((row, reel) => matrix[reel][row]);

  // The symbol this line is "about" = first non-wild from the left
  // (SCATTER never pays on a line, so in that case only a leading wild run can pay)
  const target = symbols.find((s) => s !== 'WILD') ?? 'WILD';

  let targetCount = 0;
  for (const s of symbols) {
    if (s === target || s === 'WILD') targetCount++;
    else break;
  }

  let wildCount = 0;
  for (const s of symbols) {
    if (s === 'WILD') wildCount++;
    else break;
  }

  const targetPay = target === 'SCATTER' ? 0 : pay(target, targetCount);
  const wildPay = pay('WILD', wildCount);

  // Pay whichever interpretation is better for the player
  const useWild = wildPay > targetPay;
  const symbol: SymbolId = useWild ? 'WILD' : target;
  const count = useWild ? wildCount : targetCount;
  const multiplier = useWild ? wildPay : targetPay;

  if (multiplier === 0) return null;

  const positions: Position[] = [];
  for (let reel = 0; reel < count; reel++) positions.push({ reel, row: rows[reel] });

  return { lineIndex, symbol, count, amount: multiplier * lineBet, positions };
}

export interface Evaluation {
  wins: LineWin[];
  totalWin: number;
  scatterPositions: Position[];
  freeSpinsWon: number;
}

export function evaluate(matrix: Matrix, totalBet: number): Evaluation {
  const lineBet = totalBet / LINES.length;
  const wins: LineWin[] = [];
  for (let i = 0; i < LINES.length; i++) {
    const win = evaluateLine(matrix, i, lineBet);
    if (win) wins.push(win);
  }

  const scatterPositions: Position[] = [];
  matrix.forEach((column, reel) =>
    column.forEach((symbol, row) => {
      if (symbol === 'SCATTER') scatterPositions.push({ reel, row });
    }),
  );

  return {
    wins,
    totalWin: wins.reduce((sum, w) => sum + w.amount, 0),
    scatterPositions,
    freeSpinsWon: scatterPositions.length >= SCATTERS_FOR_FREE_SPINS ? FREE_SPINS_AWARD : 0,
  };
}
