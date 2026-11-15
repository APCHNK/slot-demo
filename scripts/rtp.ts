// RTP simulation: runs the real game math N times and prints the stats.
// Usage: npm run rtp            (1,000,000 spins)
//        npm run rtp -- 5000000 (custom count)

import { BETS } from '../src/server/config';
import { evaluate, spinReels } from '../src/server/math';
import type { SymbolId } from '../src/server/types';

const spins = Number(process.argv[2] ?? 1_000_000);
const bet = BETS[0] * 10; // any valid bet, RTP doesn't depend on it

let totalBet = 0;
let totalWin = 0;
let hits = 0;
let maxWin = 0;
let freeSpinTriggers = 0;
const winBySymbol = new Map<SymbolId, number>();

const started = performance.now();

for (let i = 0; i < spins; i++) {
  const result = evaluate(spinReels(Math.random), bet);
  totalBet += bet;
  totalWin += result.totalWin;
  if (result.totalWin > 0) hits++;
  if (result.totalWin > maxWin) maxWin = result.totalWin;
  if (result.freeSpinsWon > 0) freeSpinTriggers++;
  for (const w of result.wins) {
    winBySymbol.set(w.symbol, (winBySymbol.get(w.symbol) ?? 0) + w.amount);
  }
}

const seconds = ((performance.now() - started) / 1000).toFixed(1);
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

console.log(`\nSpins:            ${spins.toLocaleString('en')} (${seconds}s)`);
console.log(`Base game RTP:    ${pct(totalWin / totalBet)}`);
console.log(`Hit frequency:    ${pct(hits / spins)} (1 in ${(spins / hits).toFixed(1)})`);
console.log(`Max win:          ${(maxWin / bet).toFixed(0)}x bet`);
console.log(`Free spins hit:   1 in ${freeSpinTriggers ? Math.round(spins / freeSpinTriggers) : '∞'} spins`);
console.log('\nRTP contribution by symbol:');
for (const [symbol, win] of [...winBySymbol].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${symbol.padEnd(8)} ${pct(win / totalBet)}`);
}
console.log('\nNote: free spins are not simulated yet, so real RTP = base game + free spins.\n');
