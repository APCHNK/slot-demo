import { Container, Graphics, Text } from 'pixi.js';

interface ButtonOptions {
  width: number;
  height: number;
  label: string;
  color: number;
  fontSize?: number;
  /** Draw as a circle with diameter = width */
  round?: boolean;
}

/** Simple clickable button. Origin is the button's center. */
export class Button extends Container {
  private readonly text: Text;
  private _enabled = true;

  constructor(options: ButtonOptions, onClick: () => void) {
    super();
    const { width, height, label, color, fontSize = 28, round = false } = options;

    const bg = new Graphics();
    if (round) bg.circle(0, 0, width / 2);
    else bg.roundRect(-width / 2, -height / 2, width, height, 14);
    bg.fill(color).stroke({ width: 3, color: 0xffffff, alpha: 0.6 });

    this.text = new Text({
      text: label,
      style: { fontFamily: 'Arial Black, Arial, sans-serif', fontSize, fontWeight: '900', fill: 0xffffff },
    });
    this.text.anchor.set(0.5);
    this.addChild(bg, this.text);

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => this._enabled && onClick());
    this.on('pointerover', () => this._enabled && this.scale.set(1.05));
    this.on('pointerout', () => this.scale.set(1));
    this.on('pointerdown', () => this._enabled && this.scale.set(0.95));
    this.on('pointerup', () => this._enabled && this.scale.set(1.05));
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.alpha = value ? 1 : 0.4;
    this.cursor = value ? 'pointer' : 'default';
    if (!value) this.scale.set(1);
  }

  setText(value: string): void {
    this.text.text = value;
  }
}
