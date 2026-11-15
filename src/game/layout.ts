// The whole game is laid out in a fixed "design" resolution
// and scaled to fit the screen (see fitToScreen in main.ts).
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const SYMBOL_SIZE = 150;
export const REEL_WIDTH = 150;

export const REELS_X = 265; // (1280 - 5 * 150) / 2
export const REELS_Y = 95;

/** Reel speed while spinning, in symbols per second */
export const SPIN_SPEED = 18;
/** Delay between reels starting / stopping, seconds */
export const START_STAGGER = 0.06;
export const STOP_STAGGER = 0.18;
/** Minimum time the reels spin even if the server answers instantly, seconds */
export const MIN_SPIN_TIME = 0.8;
