
// vite config example
// import { defineConfig } from 'vite'
// import { svelte } from '@sveltejs/vite-plugin-svelte'
// import sveltePreprocess from 'svelte-preprocess'
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
  root: '.',
  css: {
    internal: false,
  },
  // viteConfig: {
  //   plugins: [
  //     legacy({
  //       targets: ['defaults', 'not IE 11']
  //     })
  //   ]
  // }
}