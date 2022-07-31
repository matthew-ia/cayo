import { rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { logger } from './logger.js';
import cayoPreprocess from './preprocess/index.js';
import chalk from 'chalk';
// TODO: consider: should some of this rollup plugin stuff be config based and not default?
import resolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';

// import esbuild from 'esbuild';
// reference this when we  decide we want to try to use esbuild:
// https://github.com/evanw/esbuild/issues/619#issuecomment-1017918747

// TODO: add a function that only gets the dependencies of an input file
// need to do this when running handleDependencies on a page, so I can surely get
// the nested deps, which my recursive thing doesn't seem to get, and this might be faster anyway.
// 
// I think what I'd actually want to do is just rewrite a good bit of dependencies.js 
// to use this new getDeps function

function inputOptions(input) {
  return { 
    input, 
    onwarn: function ( message ) {
      if ( /external dependency/.test( message ) ) return;
      // console.error( message );
    },
  };
}

export async function getDeps(input, config) {
  let bundle;
  const options = { 
    ...inputOptions(input),
    plugins: [
      svelte({
        // NOTE: pretty sure this could break pretty easily if user-defined preprocess stuff isn't passed down
        // maybe need to separetely support svelte-specific config as a different key in the cayo config
        preprocess: sveltePreprocess(),
      }), 
      css(),
      json(),
      // resolve()
    ]
  }
  // console.log('config', options);
  try {
    // create a bundle
    bundle = await rollup(options);
    // an array of file names this bundle depends on
    return bundle.watchFiles;

  } catch (error) {
    // do some error reporting
    const spacer = '       '; // aligns with '[cayo] <message>' messages
    logger.error(`Error: Parsing dependencies in '${input.replace(config.src, 'src/')}'`);
    logger.error(`${spacer}Rollup: ${error.code}\n${spacer}Rollup: ${error.message}`, { prefix: false });
    // console.error(error);
  }
  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
}

// TODO: should probably support rollup plugins passed via config
export async function build(input, config) {
  let bundle;
  let output = {
    code: '',
    dependencies: [],
  };

  // const files = 

  const options = { 
    ...inputOptions(input),
    // input: 'entry', // override default option.input
    plugins: [
      svelte({
        // NOTE: pretty sure this could break pretty easily if user-defined preprocess stuff isn't passed down
        // maybe need to separetely support svelte-specific config as a different key in the cayo config
        preprocess: [
          // Internal cayo preprocessors
          cayoPreprocess(input, config.src, config.cayoPath, config),
          // Auto preprocessors from svelte-preprocess 
          sveltePreprocess(),
        ],
        compilerOptions: {
          generate: 'ssr', 
          dev: false, // probably want this
          hydratable: false, // this is default, may need to be changed just fo Cayo components
          preserveComments: true, // optional, may be useful for dev
          preserveWhitespace: true, // optional, may be useful for dev
        }
      }), 
      css(),
      json(),
      // virtual({
      //   files: {
      //     [`${input}`]: source,
      //   },
      // }),
      
      
      // css(),
      // resolve()
    ]
  }

  try {
    // create a bundle
    bundle = await rollup(options);

    // an array of file names this bundle depends on
    output.dependencies = bundle.watchFiles;
    // console.log(`rollup deps for ${input}\n`, output.dependencies);
    // the plain text code of the bundle output
    output.code = await generateOutputs(bundle);

    return output;

  } catch (error) {
    // do some error reporting
    // const spacer = '       '; // aligns with '[cayo] <message>' messages
    let spacer = '> ';
    // TODO: report the src file instead of the compiled file here
    let srcFilename = input
      .replace(`${config.cayoPath}__cayo`, 'src')
      .replace('.svelte.js', '.svelte')
      logger.error(`Error: Creating bundle for '${srcFilename}'`);
    logger.error(`${spacer}Cayo: You may be importing an unsupported file type inside <script>, such as a CSS file`, { prefix: false });
    logger.error(`${spacer}Rollup: ${error.code}\n${spacer}Rollup: ${error.stack}`, { prefix: false });
    // console.log(error.stack);
  }
  if (bundle) {
    // closes the bundle
    await bundle.close();
  }
}

async function generateOutputs(bundle) {
  const outputOptions = { }
  // generate output specific code in-memory
  // you can call this function multiple times on the same bundle object
  // replace bundle.generate with bundle.write to directly write to disk
  const { output } = await bundle.generate(outputOptions);

  return output[0].code;
}
