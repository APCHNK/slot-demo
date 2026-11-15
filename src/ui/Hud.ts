import gsap from 'gsap';
import { Container, Graphics, Text, type TextStyleOptions } from 'pixi.js';
import { DESIGN_WIDTH } from '../game/layout';
import { formatMoney } from '../utils/format';
import { Button } from './Button';

const LABEL: TextStyleOptions = { fontFamily: 'Arial, sans-serif', fontSize: 16, fill: 0xb8a9e0, letterSpacing: 2 };
const VALUE: TextStyleOptions = { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 28, fontWeight: '900', fill: 0xffffff };

export interface HudCallbacks {
  onSpin: () => void;
  onBetChange: (direction: 1 | -1) => void;
}

/** Bottom bar: balance, bet selector, win, spin button + a message line. */
export class Hud extends Container {
  private readonly balanceText: Text;
  private readonly betText: Text;
  private readonly winText: Text;
  private readonly messageText: Text;
  private readonly spinButton: Button;
  private readonly betMinus: Button;
  private readonly betPlus: Button;
  private readonly winCounter = { value: 0 };

  constructor({ onSpin, onBetChange }: HudCallbacks) {
    super();

    const bar = new Graphics().rect(0, 0, DESIGN_WIDTH, 130).fill({ color: 0x000000, alpha: 0.45 });
    this.addChild(bar);

    // Balance
    this.addLabel('BALANCE', 140, 30);
    this.balanceText = this.addValue(140, 72);

    // Bet
    this.addLabel('BET', 420, 30);
    this.betText = this.addValue(420, 72);
    this.betMinus = new Button({ width: 48, height: 48, label: '−', color: 0x5a189a }, () => onBetChange(-1));
    this.betPlus = new Button({ width: 48, height: 48, label: '+', color: 0x5a189a }, () => onBetChange(1));
    this.betMinus.position.set(320, 72);
    this.betPlus.position.set(520, 72);
    this.addChild(this.betMinus, this.betPlus);

    // Win
    this.addLabel('WIN', 760, 30);
    this.winText = this.addValue(760, 72);
    this.winText.style.fill = 0xffd166;

    // Spin
    this.spinButton = new Button({ width: 110, height: 110, label: 'SPIN', color: 0xe85d04, round: true }, onSpin);
    this.spinButton.position.set(1110, 65);
    this.addChild(this.spinButton);

    // Message (shown above the bar)
    this.messageText = new Text({ text: '', style: { ...LABEL, fontSize: 20, fill: 0xff8fa3 } });
    this.messageText.anchor.set(0.5);
    this.messageText.position.set(DESIGN_WIDTH / 2, -18);
    this.addChild(this.messageText);
  }

  setBalance(cents: number): void {
    this.balanceText.text = formatMoney(cents);
  }

  setBet(cents: number, canDecrease: boolean, canIncrease: boolean): void {
    this.betText.text = formatMoney(cents);
    this.betMinus.enabled = canDecrease;
    this.betPlus.enabled = canIncrease;
  }

  setWin(cents: number): void {
    gsap.killTweensOf(this.winCounter);
    this.winCounter.value = cents;
    this.winText.text = cents > 0 ? formatMoney(cents) : '';
  }

  /** Animated count-up of the win value */
  countUpWin(cents: number, duration = 0.8): void {
    this.winCounter.value = 0;
    gsap.to(this.winCounter, {
      value: cents,
      duration,
      ease: 'power1.out',
      onUpdate: () => {
        this.winText.text = formatMoney(Math.round(this.winCounter.value));
      },
    });
  }

  setMessage(text: string): void {
    this.messageText.text = text;
  }

  setControlsEnabled({ spin, bet }: { spin: boolean; bet: boolean }): void {
    this.spinButton.enabled = spin;
    if (!bet) {
      this.betMinus.enabled = false;
      this.betPlus.enabled = false;
    }
  }

  private addLabel(text: string, x: number, y: number): void {
    const label = new Text({ text, style: LABEL });
    label.anchor.set(0.5);
    label.position.set(x, y);
    this.addChild(label);
  }

  private addValue(x: number, y: number): Text {
    const value = new Text({ text: '', style: VALUE });
    value.anchor.set(0.5);
    value.position.set(x, y);
    this.addChild(value);
    return value;
  }
}
