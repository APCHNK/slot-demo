import type { SymbolId } from './types';

export const REELS = 5;
export const ROWS = 3;

/** Row index per reel for each payline (row 0 = top). */
export const LINES: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 0, 1, 2, 1],
];

/** Total bets in cents. Each must divide evenly by LINES.length. */
export const BETS = [10, 20, 50, 100, 200, 500];
export const DEFAULT_BET = 100;
export const START_BALANCE = 100_000; // 1000.00

/** Multiplier of the line bet for 3, 4, 5 of a kind. */
export const PAYTABLE: Partial<Record<SymbolId, Record<3 | 4 | 5, number>>> = {
  TEN:   { 3: 10,  4: 30,  5: 100 },
  J:     { 3: 10,  4: 30,  5: 100 },
  Q:     { 3: 15,  4: 40,  5: 150 },
  K:     { 3: 20,  4: 50,  5: 200 },
  A:     { 3: 25,  4: 60,  5: 250 },
  STAR:  { 3: 40,  4: 150, 5: 600 },
  SEVEN: { 3: 60,  4: 250, 5: 1000 },
  WILD:  { 3: 100, 4: 400, 5: 2000 },
};

export const SCATTERS_FOR_FREE_SPINS = 3;
export const FREE_SPINS_AWARD = 10;

/**
 * How many times each symbol appears on a reel strip.
 * Tune these (and the paytable) and run `npm run rtp` to see the effect.
 */
const STRIP_WEIGHTS: Record<SymbolId, number>[] = [
  { TEN: 6, J: 6, Q: 5, K: 5, A: 4, STAR: 3, SEVEN: 2, WILD: 1, SCATTER: 1 },
  { TEN: 6, J: 6, Q: 5, K: 5, A: 4, STAR: 3, SEVEN: 2, WILD: 1, SCATTER: 1 },
  { TEN: 6, J: 6, Q: 5, K: 5, A: 4, STAR: 3, SEVEN: 2, WILD: 1, SCATTER: 1 },
  { TEN: 6, J: 6, Q: 5, K: 5, A: 4, STAR: 3, SEVEN: 2, WILD: 1, SCATTER: 1 },
  { TEN: 6, J: 6, Q: 5, K: 5, A: 4, STAR: 3, SEVEN: 2, WILD: 1, SCATTER: 1 },
];

/** Small seeded PRNG so the strips are the same on every run. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStrip(weights: Record<SymbolId, number>, seed: number): SymbolId[] {
  const strip: SymbolId[] = [];
  for (const [symbol, count] of Object.entries(weights) as [SymbolId, number][]) {
    for (let i = 0; i < count; i++) strip.push(symbol);
  }
  const rand = mulberry32(seed);
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

export const REEL_STRIPS: SymbolId[][] = STRIP_WEIGHTS.map((w, i) => buildStrip(w, 1000 + i));
