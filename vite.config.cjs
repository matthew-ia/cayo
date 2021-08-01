const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');
const sveltePreprocess = require('svelte-preprocess');

// import rollupConfig from './rollup.config.js';
// TODO: make this dynamic
const cayoConfig = {
	rootPath: 'test',
}

// https://vitejs.dev/config/
module.exports = defineConfig({
  // root: './.cayo/',
  build: {
    watch: {
      // include: `./**/*`
    }
  },
  rollupOptions: {
    watch: {
      include: `${cayoConfig.rootPath}/src/**/*`
    }
  },
  plugins: [svelte({
    preprocess: sveltePreprocess({ preserve: ['json'] }),
    compilerOptions: {
      generate: 'ssr',
      hydratable: true,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      // css: css => {
      //   css.write('dist/bundle.css'); // (3)
      // },
    },
  })],
  
  // build: {
  //   target: 'node16',
  //   rollupOptions: {
  //     output: {
  //       sourcemap: true,
  //       format: 'esm',
  //     }
  //   }
  // },
  // ssr: {
  //   target: 'node',
  // }
})
