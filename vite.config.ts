import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

// base './': rutas relativas, para que funcione en https://usuario.github.io/<repo>/
export default defineConfig({
  base: './',
  plugins: [svelte()],
  define: { __VERSION__: JSON.stringify(version) },
  build: { target: 'es2022', sourcemap: false },
  test: { include: ['tests/**/*.test.ts'] },
});
