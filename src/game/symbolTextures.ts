// Placeholder symbols drawn in code, so the project runs without any art.
// Later: replace this with real art loaded from a texture atlas via Assets.load(),
// keeping the same SymbolTextures shape, and nothing else has to change.

import { Container, Graphics, Rectangle, Text, type Renderer, type Texture } from 'pixi.js';
import type { SymbolId } from '../server/types';
import { SYMBOL_SIZE } from './layout';

const LOOK: Record<SymbolId, { label: string; color: number }> = {
  TEN:     { label: '10',   color: 0x3a86ff },
  J:       { label: 'J',    color: 0x2ec4b6 },
  Q:       { label: 'Q',    color: 0x8338ec },
  K:       { label: 'K',    color: 0xff006e },
  A:       { label: 'A',    color: 0xfb5607 },
  STAR:    { label: '★',    color: 0xffbe0b },
  SEVEN:   { label: '7',    color: 0xd62828 },
  WILD:    { label: 'WILD', color: 0x06a77d },
  SCATTER: { label: '$',    color: 0xb5179e },
};

export const SYMBOL_IDS = Object.keys(LOOK) as SymbolId[];

export type SymbolTextures = Record<SymbolId, Texture>;

export function createSymbolTextures(renderer: Renderer): SymbolTextures {
  const textures = {} as SymbolTextures;
  const pad = 8;

  for (const id of SYMBOL_IDS) {
    const { label, color } = LOOK[id];
    const view = new Container();

    const bg = new Graphics()
      .roundRect(pad, pad, SYMBOL_SIZE - pad * 2, SYMBOL_SIZE - pad * 2, 20)
      .fill(color)
      .stroke({ width: 4, color: 0xffffff, alpha: 0.35 });

    const text = new Text({
      text: label,
      style: {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: label.length > 2 ? 34 : 68,
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 6 },
      },
    });
    text.anchor.set(0.5);
    text.position.set(SYMBOL_SIZE / 2, SYMBOL_SIZE / 2);

    view.addChild(bg, text);
    textures[id] = renderer.generateTexture({
      target: view,
      frame: new Rectangle(0, 0, SYMBOL_SIZE, SYMBOL_SIZE),
      antialias: true,
    });
    view.destroy({ children: true });
  }

  return textures;
}
