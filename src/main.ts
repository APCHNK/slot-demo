import { Application } from 'pixi.js';
import { Game } from './game/Game';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './game/layout';
import { MockServer } from './server/mockServer';

async function bootstrap(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#0d0b1a',
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio, 2),
  });
  document.body.appendChild(app.canvas);

  // Lets the "PixiJS DevTools" browser extension inspect the scene
  (globalThis as { __PIXI_APP__?: Application }).__PIXI_APP__ = app;

  const game = new Game(app, new MockServer());
  app.stage.addChild(game);

  // Scale the fixed design resolution to fit the window (letterboxed).
  // TODO (step 9): separate portrait layout for phones.
  const fitToScreen = () => {
    const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    game.scale.set(scale);
    game.position.set((window.innerWidth - DESIGN_WIDTH * scale) / 2, (window.innerHeight - DESIGN_HEIGHT * scale) / 2);
  };
  window.addEventListener('resize', fitToScreen);
  fitToScreen();

  await game.init();
}

void bootstrap();
