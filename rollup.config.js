import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
// import { terser } from 'rollup-plugin-terser';
// import { sass } from 'svelte-preprocess-sass';


// TODO: make this dynamic
const cayoConfig = {
	rootPath: 'test',
}

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/prerender.js', // (1)
	output: {
		sourcemap: true,
		format: 'es',
		// name: 'app',
		// file: 'dist/prerender.js' // (2)
		inlineDynamicImports: true,
		dir: './dist', // (2)
		compact: false,
	},
	plugins: [
		svelte({
			// enable run-time checks when not in production
			
			compilerOptions: {
				generate: 'ssr',
				hydratable: true,
				dev: !production,
				// css: css => {
				// 	css.write('dist/bundle.css'); // (3)
				// },
			},
			// we'll extract any component CSS out into
			// a separate file - better for performance
			
			// preprocess: {
			// 	style: sass(),
			// },
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('dist'), // (4)

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		// production && terser(),
	],
	watch: {
		include: `${cayoConfig.rootPath}/src/**/*`,
		clearScreen: false
	}
};

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}

