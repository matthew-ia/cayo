
// vite config example
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import sveltePreprocess from 'svelte-preprocess'
// const viteConfig = defineConfig({
//   // root: './.cayo/',
//   plugins: [svelte({
//     preprocess: sveltePreprocess({ preserve: ['json'] }),
//     compilerOptions: {
//       hydratable: true,
//     },
//   })],
// });

export default {
  // projectRoot: '.',
  // css: {
  //   internal: false,
  // },
  templateFileName: '__layout',
  viteConfig: {
    base: '/vite/',
    plugins: [svelte({
      preprocess: sveltePreprocess({ preserve: ['json'] }),
      compilerOptions: {
        hydratable: true,
      },
    })],
    server: {
      port: '5005',
    },
  },
  base: '/cayo/'
}