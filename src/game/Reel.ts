// One reel = ROWS visible symbols + 1 hidden buffer symbol above.
//
// How it works: imagine an endless "tape" of symbols. `scroll` is how far the tape
// has moved down (in symbols). Every frame, render() places the sprites according
// to `scroll` and assigns them textures from the tape. Symbols that were never
// shown are random filler; when we stop, we write the server result into the tape
// at the exact place where the reel will come to rest.

import gsap from 'gsap';
import { Container, Sprite } from 'pixi.js';
import { ROWS } from '../server/config';
import type { SymbolId } from '../server/types';
import { SPIN_SPEED, SYMBOL_SIZE } from './layout';
import { SYMBOL_IDS, type SymbolTextures } from './symbolTextures';

const randomSymbol = (): SymbolId => {
  // Filler shouldn't show scatters/wilds too often, or the spin looks "lucky"
  const pool = SYMBOL_IDS.filter((s) => s !== 'SCATTER' && s !== 'WILD');
  return pool[Math.floor(Math.random() * pool.length)];
};

export class Reel extends Container {
  /** sprites[0] is the hidden buffer above, sprites[1..ROWS] are the visible rows */
  private readonly sprites: Sprite[] = [];
  private tape = new Map<number, SymbolId>();
  private scroll = 0;
  private speed = 0;
  private spinning = false;
  private startTimeline?: gsap.core.Timeline;

  constructor(private readonly textures: SymbolTextures, initial: SymbolId[]) {
    super();
    for (let i = 0; i <= ROWS; i++) {
      const sprite = new Sprite();
      sprite.anchor.set(0.5);
      sprite.x = SYMBOL_SIZE / 2;
      this.sprites.push(sprite);
      this.addChild(sprite);
    }
    this.land(initial);
  }

  update(dt: number): void {
    if (this.spinning) this.scroll += this.speed * dt;
    this.render();
  }

  startSpin(delay = 0): void {
    this.startTimeline = gsap
      .timeline({ delay })
      // small "wind-up": reel moves up a bit before spinning down
      .to(this, { scroll: this.scroll - 0.25, duration: 0.15, ease: 'sine.out' })
      .add(() => {
        this.speed = 0;
        this.spinning = true;
      })
      .to(this, { speed: SPIN_SPEED, duration: 0.2, ease: 'power1.in' });
  }

  /** Stops the reel so that `column` (top → bottom) is visible. Resolves when it has settled. */
  async stop(column: SymbolId[]): Promise<void> {
    if (this.startTimeline?.isActive()) await this.startTimeline;
    this.spinning = false;

    // Land a few symbols ahead of everything that has already been on screen
    const target = Math.floor(this.scroll) + ROWS + 2;
    this.writeColumn(column, target);

    // Match the stop tween's starting speed to the current speed so there's no jerk.
    // For back.out(c) the initial velocity is (c + 3) * distance / duration.
    const overshoot = 1.2;
    const distance = target - this.scroll;
    const duration = gsap.utils.clamp(0.25, 1.2, ((overshoot + 3) * distance) / Math.max(this.speed, 1));

    await gsap.to(this, { scroll: target, duration, ease: `back.out(${overshoot})` });

    // Reset the tape so numbers don't grow forever; looks identical on screen
    this.land(column);
  }

  /** Sprite at a visible row. Only meaningful while the reel is stopped. */
  getSprite(row: number): Sprite {
    return this.sprites[row + 1];
  }

  private land(column: SymbolId[]): void {
    this.tape.clear();
    this.scroll = 0;
    this.speed = 0;
    this.writeColumn(column, 0);
    this.render();
  }

  /** When scroll === offset, sprites[1..ROWS] show tape[offset + ROWS - 1 ... offset]. */
  private writeColumn(column: SymbolId[], offset: number): void {
    column.forEach((symbol, row) => this.tape.set(offset + ROWS - 1 - row, symbol));
  }

  private symbolAt(index: number): SymbolId {
    let symbol = this.tape.get(index);
    if (!symbol) {
      symbol = randomSymbol();
      this.tape.set(index, symbol);
    }
    return symbol;
  }

  private render(): void {
    const base = Math.floor(this.scroll);
    const frac = this.scroll - base;
    this.sprites.forEach((sprite, i) => {
      const texture = this.textures[this.symbolAt(base - i + ROWS)];
      if (sprite.texture !== texture) sprite.texture = texture;
      sprite.y = (i - 1 + frac) * SYMBOL_SIZE + SYMBOL_SIZE / 2;
    });
  }
}
