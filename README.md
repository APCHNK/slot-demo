# Slot Demo — HTML5 slot game (PixiJS + TypeScript)

A 5×3, 10-line video slot built with **PixiJS 8**, **TypeScript**, **GSAP** and **Vite**.
The game client is fully separated from the game math: the client only renders results
returned by a (mock) server, the same way real slots talk to an RGS.

**Live demo:** https://apchnk.github.io/slot-demo/

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (also reachable from your phone on the same Wi-Fi)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
npm run rtp        # simulate 1,000,000 spins and print RTP / hit rate
npm run deploy     # build and publish dist/ to GitHub Pages (gh-pages branch)
```

Requires Node.js 20+. Press **Space** or click **SPIN**.

## How it works

```
src/
  server/            "Backend": pure game math, no rendering
    types.ts         API contract (InitResponse, SpinResponse, …). Money is in cents.
    config.ts        Reel strips, paytable, paylines, bets
    math.ts          spinReels() + evaluate(): pure functions, shared with the RTP script
    mockServer.ts    Async wrapper with balance + fake network latency
  game/              Client
    Game.ts          Orchestrator: server calls, state machine, HUD, reels
    StateMachine.ts  loading → idle → spinning → stopping → showWins → idle
    ReelSet.ts       5 reels, mask, frame, staggered start/stop
    Reel.ts          One reel: "endless tape" model, lands exactly on the server result
    WinPresenter.ts  Paylines + pulsing winning symbols, skippable
    symbolTextures.ts Placeholder symbols drawn in code (swap for a real atlas)
    layout.ts        Design resolution and timing constants
  ui/                Hud (balance / bet / win / spin) and Button
scripts/rtp.ts       Monte Carlo RTP simulation using the real math
```

Key decisions:

- **Server-authoritative results.** The client never decides an outcome. `MockServer` can be
  replaced by real `fetch`/WebSocket calls without touching the game code.
- **State machine.** Illegal flows (spinning while stopping, changing bet mid-spin) throw immediately.
- **Integer money.** All amounts are cents, so there are no floating point rounding bugs.
- **Measured math.** `npm run rtp` runs the same `evaluate()` the game uses. Current base game RTP ≈ 94%.

## Deploy to a VPS

The build is plain static files, so any web server works.

```bash
npm run build
rsync -avz --delete dist/ user@your-vps:/var/www/slot/
```

**Caddy** (automatic HTTPS):

```
slot.example.com {
    root * /var/www/slot
    encode gzip
    file_server
}
```

**nginx**:

```nginx
server {
    listen 80;
    server_name slot.example.com;
    root /var/www/slot;
    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 30d; add_header Cache-Control "public, immutable"; }
}
```

Then `sudo certbot --nginx -d slot.example.com` for HTTPS.

## Roadmap

- [ ] Real art: texture atlas loaded with `Assets`, replacing `symbolTextures.ts`
- [ ] Quick stop (Spin during spinning), turbo mode, autoplay
- [ ] Big Win / Mega Win celebration
- [ ] Free spins: the server already returns `freeSpinsWon` and `scatterPositions`
- [ ] Sounds (`@pixi/sound` or Howler)
- [ ] Spine animations for symbol wins
- [ ] Portrait layout for phones
- [ ] Move the math to a real Node backend (Fastify + WebSocket) on the VPS
- [ ] Include free spins in the RTP simulation and rebalance
- [ ] Unit tests for `math.ts` (Vitest)
