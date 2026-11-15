// Orchestrates everything: talks to the server, drives the state machine,
// and tells the reels / HUD / win presenter what to do.

import { Container, Text, type Application } from 'pixi.js';
import type { MockServer } from '../server/mockServer';
import { ServerError, type Matrix, type SpinResponse } from '../server/types';
import { Hud } from '../ui/Hud';
import { wait } from '../utils/time';
import { DESIGN_HEIGHT, DESIGN_WIDTH, MIN_SPIN_TIME, REELS_X, REELS_Y } from './layout';
import { ReelSet } from './ReelSet';
import { StateMachine } from './StateMachine';
import { createSymbolTextures } from './symbolTextures';
import { WinPresenter } from './WinPresenter';

type GameState = 'loading' | 'idle' | 'spinning' | 'stopping' | 'showWins';

const TRANSITIONS: Record<GameState, readonly GameState[]> = {
  loading: ['idle'],
  idle: ['spinning'],
  spinning: ['stopping'],
  stopping: ['showWins', 'idle'],
  showWins: ['idle'],
};

export class Game extends Container {
  private readonly fsm = new StateMachine<GameState>('loading', TRANSITIONS);
  private reelSet!: ReelSet;
  private winPresenter!: WinPresenter;
  private hud!: Hud;

  private balance = 0;
  private bets: number[] = [];
  private betIndex = 0;
  private matrix: Matrix = [];
  private spinQueued = false;

  constructor(
    private readonly app: Application,
    private readonly server: MockServer,
  ) {
    super();
    this.fsm.onChange((to, from) => {
      if (import.meta.env.DEV) console.log(`[state] ${from} → ${to}`);
      this.updateControls();
    });
  }

  async init(): Promise<void> {
    const loading = new Text({ text: 'Loading…', style: { fill: 0xffffff, fontSize: 32 } });
    loading.anchor.set(0.5);
    loading.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    this.addChild(loading);

    const data = await this.server.init();
    this.balance = data.balance;
    this.bets = data.bets;
    this.betIndex = Math.max(0, data.bets.indexOf(data.defaultBet));
    this.matrix = data.matrix;

    const textures = createSymbolTextures(this.app.renderer);
    this.reelSet = new ReelSet(textures, this.matrix);
    this.reelSet.position.set(REELS_X, REELS_Y);

    this.winPresenter = new WinPresenter(this.reelSet);
    this.winPresenter.position.copyFrom(this.reelSet.position);

    this.hud = new Hud({
      onSpin: () => this.requestSpin(),
      onBetChange: (dir) => this.changeBet(dir),
    });
    this.hud.y = DESIGN_HEIGHT - 130;

    const title = new Text({
      text: 'SLOT DEMO',
      style: { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 40, fontWeight: '900', fill: 0xffd166, letterSpacing: 6 },
    });
    title.anchor.set(0.5);
    title.position.set(DESIGN_WIDTH / 2, 42);

    loading.destroy();
    this.addChild(title, this.reelSet, this.winPresenter, this.hud);

    this.app.ticker.add((ticker) => this.reelSet.update(ticker.deltaMS / 1000));
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.requestSpin();
      }
    });

    this.hud.setBalance(this.balance);
    this.hud.setWin(0);
    this.fsm.go('idle');
  }

  /** Spin button / space bar */
  private requestSpin(): void {
    if (this.fsm.is('idle')) {
      void this.spin();
    } else if (this.fsm.is('showWins')) {
      // Skip the win presentation and spin again right after it closes
      this.spinQueued = true;
      this.winPresenter.clear();
    }
    // TODO (step 7): during 'spinning' this could trigger a quick stop ("slam stop")
  }

  private async spin(): Promise<void> {
    const bet = this.bets[this.betIndex];
    if (this.balance < bet) {
      this.hud.setMessage('Not enough balance — lower the bet');
      return;
    }

    this.hud.setMessage('');
    this.hud.setWin(0);
    this.hud.setBalance(this.balance - bet); // show the bet as taken right away
    this.fsm.go('spinning');
    this.reelSet.startSpin();

    let result: SpinResponse | null = null;
    try {
      [result] = await Promise.all([this.server.spin(bet), wait(MIN_SPIN_TIME)]);
    } catch (error) {
      console.error(error);
      this.hud.setMessage(error instanceof ServerError ? `Server error: ${error.code}` : 'Connection error');
    }

    // On error, land the reels back on the previous symbols
    this.fsm.go('stopping');
    await this.reelSet.stop(result ? result.matrix : this.matrix);

    if (!result) {
      this.hud.setBalance(this.balance);
      this.fsm.go('idle');
      return;
    }

    this.matrix = result.matrix;
    this.balance = result.balance;

    if (result.totalWin > 0) {
      this.fsm.go('showWins');
      this.hud.countUpWin(result.totalWin);
      await this.winPresenter.show(result);
      this.hud.setWin(result.totalWin);
    }

    // TODO (step 8): if (result.freeSpinsWon > 0) → enter a free spins state

    this.hud.setBalance(this.balance);
    this.fsm.go('idle');

    if (this.spinQueued) {
      this.spinQueued = false;
      void this.spin();
    }
  }

  private changeBet(direction: 1 | -1): void {
    if (!this.fsm.is('idle')) return;
    this.betIndex = Math.min(this.bets.length - 1, Math.max(0, this.betIndex + direction));
    this.updateControls();
  }

  private updateControls(): void {
    if (!this.hud) return;
    const idle = this.fsm.is('idle');
    this.hud.setControlsEnabled({ spin: idle || this.fsm.is('showWins'), bet: idle });
    if (idle) {
      this.hud.setBet(this.bets[this.betIndex], this.betIndex > 0, this.betIndex < this.bets.length - 1);
    }
  }
}
