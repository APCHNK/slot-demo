import { Container, Graphics, type Sprite } from 'pixi.js';
import { REELS, ROWS } from '../server/config';
import type { Matrix, Position } from '../server/types';
import { wait } from '../utils/time';
import { REEL_WIDTH, START_STAGGER, STOP_STAGGER, SYMBOL_SIZE } from './layout';
import { Reel } from './Reel';
import type { SymbolTextures } from './symbolTextures';

export class ReelSet extends Container {
  private readonly reels: Reel[];

  constructor(textures: SymbolTextures, matrix: Matrix) {
    super();
    const width = REELS * REEL_WIDTH;
    const height = ROWS * SYMBOL_SIZE;

    // Frame + reel backgrounds
    const frame = new Graphics()
      .roundRect(-14, -14, width + 28, height + 28, 24)
      .fill(0x2b1d4e)
      .stroke({ width: 4, color: 0xffd166 });
    for (let i = 0; i < REELS; i++) {
      frame.rect(i * REEL_WIDTH + 2, 0, REEL_WIDTH - 4, height).fill({ color: 0x000000, alpha: 0.35 });
    }
    this.addChild(frame);

    const reelLayer = new Container();
    this.reels = matrix.map((column, i) => {
      const reel = new Reel(textures, column);
      reel.x = i * REEL_WIDTH;
      reelLayer.addChild(reel);
      return reel;
    });

    const mask = new Graphics().rect(0, 0, width, height).fill(0xffffff);
    reelLayer.mask = mask;
    this.addChild(reelLayer, mask);
  }

  update(dt: number): void {
    for (const reel of this.reels) reel.update(dt);
  }

  startSpin(): void {
    this.reels.forEach((reel, i) => reel.startSpin(i * START_STAGGER));
  }

  async stop(matrix: Matrix): Promise<void> {
    await Promise.all(
      this.reels.map(async (reel, i) => {
        await wait(i * STOP_STAGGER);
        await reel.stop(matrix[i]);
      }),
    );
  }

  getSprite({ reel, row }: Position): Sprite {
    return this.reels[reel].getSprite(row);
  }

  /** Center of a cell in ReelSet local coordinates */
  cellCenter({ reel, row }: Position): { x: number; y: number } {
    return { x: reel * REEL_WIDTH + REEL_WIDTH / 2, y: row * SYMBOL_SIZE + SYMBOL_SIZE / 2 };
  }
}
