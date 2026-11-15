// Tiny finite state machine. Its job is to make illegal flows impossible:
// e.g. you can't start a spin while the reels are stopping. If the code tries,
// it throws right away instead of silently breaking the game.

type Listener<S> = (to: S, from: S) => void;

export class StateMachine<S extends string> {
  private listeners: Listener<S>[] = [];

  constructor(
    private current: S,
    private readonly transitions: Record<S, readonly S[]>,
  ) {}

  get state(): S {
    return this.current;
  }

  is(...states: S[]): boolean {
    return states.includes(this.current);
  }

  go(next: S): void {
    if (!this.transitions[this.current].includes(next)) {
      throw new Error(`Invalid state transition: ${this.current} → ${next}`);
    }
    const prev = this.current;
    this.current = next;
    for (const listener of this.listeners) listener(next, prev);
  }

  onChange(listener: Listener<S>): void {
    this.listeners.push(listener);
  }
}
