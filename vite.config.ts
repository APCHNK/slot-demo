import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths, so the build works on any domain or subfolder (VPS, GitHub Pages, Vercel)
  base: './',
  server: { host: true },
});
