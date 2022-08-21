import { rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import { logger } from './logger.js';
import cayoPreprocess from './preprocess/index.js';
import chalk from 'chalk';
// TODO: consider: should some of this rollup plugin stuff be config based and not default?
import resolve from '@rollup/plugin-node-resolve';
// import ignoreImport from 'rollup-plugin-ignore-import';
import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';


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
  // console.log('hold up bruther', input);
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
    return bundle.watchFiles.filter(dep => (dep !== input));

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
export async function build(input, config, type = 'page') {

  const ssr = (type === 'page' || type === 'template');
  const requiredCompilerOptions = {
    generate: ssr ? 'ssr' : 'dom', 
    hydratable: ssr ? false : true, // this is default, may need to be changed just fo Cayo components
  }

  let bundle;
  let output = {
    js: { code: '' },
    css: { code: '' },
    dependencies: [],
  };

  let preprocessors = config.svelte.preprocess.length > 0 
    ? config.svelte.preprocess 
    : [config.svelte.preprocess];

  const options = { 
    ...inputOptions(input),
    plugins: [
      svelte({
        preprocess: [
          // Internal cayo preprocessors
          cayoPreprocess(config),
          // User-defined preprocessors
          ...preprocessors,
        ],
        compilerOptions: {
          preserveComments: true,
          preserveWhitespace: true,
          ...config.svelte.compilerOptions,
          ...requiredCompilerOptions,
        },
        extensions: config.svelte.extensions,
      }), 
      css(),
      json(),
      ...config.rollup.plugins,
    ]
  }

  try {
    bundle = await rollup(options);
    output.dependencies = bundle.watchFiles.filter(dep => (dep !== input));
    const { js, css } = await generateOutputs(bundle, input);
    output.js = js;
    output.css = css;

    if (bundle) {
      await bundle.close();
    }

    return output;

  } catch (error) {
    let relativeFilePath = input.replace(config[`${type}s`], '');
    let errorMessage = `Could not compile ${type}: '${relativeFilePath}'`;
    errorMessage += `\n> Rollup Error: ${error.code}`; 
    if (error.code === 'PLUGIN_ERROR') {
      errorMessage += `\n> ${error.plugin} (Error code: ${error.pluginCode})`;  
    }
    errorMessage += `\n\n> Source: ${input}`;
    errorMessage += `\n${error.frame}`
    errorMessage += `\n> ${error.stack}`;

    throw new Error(errorMessage + error.message);
  }
}

async function generateOutputs(bundle, input) {
  const outputOptions = { }
  const { output } = await bundle.generate(outputOptions);
  return {
    js: {
      code: output[0].code,
    },
    css: {
      code: output[1] && output[1].fileName === 'bundle.css'
        ? output[1].source 
        : ''
    }
  };
}
