// Fake game server. Lives in the browser for the demo, but the client
// only talks to it through async methods, exactly like a real RGS.
// Swapping this for real fetch()/WebSocket calls should not touch the game code.

import { BETS, DEFAULT_BET, START_BALANCE } from './config';
import { evaluate, spinReels } from './math';
import { ServerError, type InitResponse, type SpinResponse } from './types';

const randomLatency = () => 250 + Math.random() * 350;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class MockServer {
  private balance = START_BALANCE;

  async init(): Promise<InitResponse> {
    await sleep(randomLatency());
    return {
      balance: this.balance,
      bets: [...BETS],
      defaultBet: DEFAULT_BET,
      matrix: spinReels(Math.random),
    };
  }

  async spin(bet: number): Promise<SpinResponse> {
    await sleep(randomLatency());

    if (!BETS.includes(bet)) throw new ServerError('INVALID_BET');
    if (this.balance < bet) throw new ServerError('INSUFFICIENT_FUNDS');

    this.balance -= bet;
    const matrix = spinReels(Math.random);
    const result = evaluate(matrix, bet);
    this.balance += result.totalWin;

    return { matrix, ...result, balance: this.balance };
  }
}
