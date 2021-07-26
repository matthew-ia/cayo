import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'

// import rollupConfig from './rollup.config.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte({
    preprocess: sveltePreprocess({ preserve: ['json'] }),
    compilerOptions: {
      generate: 'ssr',
      hydratable: true,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: css => {
        css.write('dist/bundle.css'); // (3)
      },
    },
  })],
  
  build: {
    target: 'node16',
    rollupOptions: {
      output: {
        sourcemap: true,
        format: 'esm',
      }
    }
  },
  ssr: {
    target: 'node',
  }
})
