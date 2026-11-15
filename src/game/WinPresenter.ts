import gsap from 'gsap';
import { Container, Graphics, type Sprite } from 'pixi.js';
import { LINES } from '../server/config';
import type { SpinResponse } from '../server/types';
import type { ReelSet } from './ReelSet';

const LINE_COLORS = [0xffd166, 0x06d6a0, 0xef476f, 0x118ab2, 0xf78c6b, 0x9b5de5, 0x00f5d4, 0xfee440, 0xf15bb5, 0x00bbf9];
const SHOW_TIME = 1.6;

/**
 * Shows the wins of a spin: paylines + pulsing symbols.
 * show() resolves after SHOW_TIME, or immediately when clear() is called (player pressed Spin again).
 */
export class WinPresenter extends Container {
  private readonly lines = new Graphics();
  private pulsing: Sprite[] = [];
  private finish?: () => void;

  constructor(private readonly reelSet: ReelSet) {
    super();
    this.addChild(this.lines);
  }

  show(result: SpinResponse): Promise<void> {
    this.clear();

    for (const win of result.wins) {
      const color = LINE_COLORS[win.lineIndex % LINE_COLORS.length];
      LINES[win.lineIndex].forEach((row, reel) => {
        const { x, y } = this.reelSet.cellCenter({ reel, row });
        if (reel === 0) this.lines.moveTo(x - 60, y);
        this.lines.lineTo(x, y);
        if (reel === LINES[win.lineIndex].length - 1) this.lines.lineTo(x + 60, y);
      });
      this.lines.stroke({ width: 6, color, alpha: 0.9, cap: 'round', join: 'round' });
    }

    const sprites = new Set(result.wins.flatMap((w) => w.positions.map((p) => this.reelSet.getSprite(p))));
    this.pulsing = [...sprites];
    gsap.to(this.pulsing.map((s) => s.scale), { x: 1.12, y: 1.12, duration: 0.25, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    return new Promise<void>((resolve) => {
      const timer = gsap.delayedCall(SHOW_TIME, () => this.finish?.());
      this.finish = () => {
        timer.kill();
        this.finish = undefined;
        resolve();
      };
    });
  }

  clear(): void {
    this.lines.clear();
    for (const sprite of this.pulsing) {
      gsap.killTweensOf(sprite.scale);
      sprite.scale.set(1);
    }
    this.pulsing = [];
    this.finish?.();
  }
}
