import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

// TODO: move this within config.js

export default defineConfig({
  clearScreen: false,
  plugins: [svelte({
    preprocess: sveltePreprocess({ preserve: ['json'] }),
    compilerOptions: {
      hydratable: true,
    },
  })],
  server: {
    port: '5000',
  }
});