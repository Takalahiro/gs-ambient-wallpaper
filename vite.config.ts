import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [svelte()],
  root: 'demo',
  publicDir: resolve(__dirname, 'public'),
  envDir: resolve(__dirname),
  server: {
    port: 5175,
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@gs-ambient/core': resolve(__dirname, 'src/core'),
      '@gs-ambient/components': resolve(__dirname, 'src/components'),
    },
  },
});
