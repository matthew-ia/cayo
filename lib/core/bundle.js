import fs from 'fs-extra';
import { rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';

const DEBUG = false;
let debugPlugin = (context, input, type) => ({
  name: 'debug-imports',
  resolveId(id, importer) {
    if (DEBUG === false) return null;
    if (type !== 'cayo') return null;
    console.log('Resolving import for type:', type, ` (${context})`);
    if (id === 'fs' || id === 'path' || id.includes('getSveltePages')) {
      console.log(`Resolving: ${id}`);
      console.log('   Imported by:', importer);
      console.log('   Input file:', this.getModuleInfo(importer)?.id || 'unknown');
      console.log('input: ', input);
    }
    return null;
  }
});

function inputOptions(input) {
  return { 
    input,
    external: (id) => {
      // Mark all svelte imports as external
      if (id.startsWith('svelte/') || id === 'svelte') {
        return true;
      }
      return false;
    },
    onwarn: function ( message ) {
      if ( /external dependency/.test( message ) ) return;
    },
  };
}

function resolvePluginDefaults(overrides = {}) {
  return {
    browser: false,
    exportConditions: ['svelte', 'browser', 'import'],
    extensions: ['.mjs', '.js', '.ts', '.svelte'],
    dedupe: ['svelte'],
    ...overrides,
  }
}

function sveltePluginDefaults() {
  return {
    include: [
      '**/*.svelte',
    ],
    onwarn: (warning, handler) => {
      console.log('Svelte processing:', warning.filename);
      handler(warning);
    }
  }
}

function defaultRollupPlugins() {
  return [css(), json()];
}

function userRollupPlugins(config) {
  return config.vite.rollupOptions.plugins;
}

export async function getDeps(input, config) {
  let bundle;
  // User-defined preprocessors
  let preprocessors = config.svelte.preprocess.length > 0 
    ? config.svelte.preprocess 
    : [config.svelte.preprocess];

  const options = { 
    ...inputOptions(input),
    plugins: [
      svelte({
        preprocess: [
          ...preprocessors,
        ],
        ...sveltePluginDefaults(),
      }), 
      resolve({
        ...resolvePluginDefaults(),
      }),
      ...defaultRollupPlugins(),
      ...userRollupPlugins(config),
    ],
  }
  try {
    // Create a bundle
    bundle = await rollup(options);
    if (bundle) {
      await bundle.close();
    }
    if (bundle) {
      await bundle.close();
    }
    // An array of file names this bundle depends on
    return bundle.watchFiles.filter(dep => (dep !== input));

  } catch (err) {
    let errorMessage = `Parsing dependencies of '${input.replace(config.src, 'src/')}'`;
    if (!fs.pathExistsSync(input)) {
      errorMessage += `\n> File does not exist: '${input}'.`;
    } else {
      errorMessage += `\n> Rollup Error: ${err.code}`; 
      if (err.code === 'PLUGIN_ERROR') {
        errorMessage += `\n> ${err.plugin} (Error code: ${err.pluginCode})`;  
      }
      errorMessage += `\n> Trace: ${err.stack}`;
    }
    
    throw new Error(errorMessage, { cause: err });
  }
  
}

export async function build(input, config, type = 'page') {
  const template = (type === 'page' || type === 'template');
  const isCayo = (type === 'cayo');
  const requiredCompilerOptions = {
    generate: template ? 'ssr' : 'dom', 
    hydratable: template ? false : true, 
    preserveComments: template 
      ? false
      : config.svelte.compilerOptions.preserveComments
        ? config.svelte.compilerOptions.preserveComments
        : true,
  }

  let bundle;
  let output = {
    js: { code: '' },
    css: { code: '' },
    dependencies: [],
  };
  // User-defined preprocessors
  let preprocessors = config.svelte.preprocess.length > 0 
    ? config.svelte.preprocess 
    : [config.svelte.preprocess];

  const options = { 
    ...inputOptions(input),
    plugins: [
      debugPlugin('build', input, type),
      svelte({
        preprocess: [
          ...preprocessors,
        ],
        ...sveltePluginDefaults(),
        compilerOptions: {
          preserveWhitespace: true,
          ...config.svelte.compilerOptions,
          ...requiredCompilerOptions,
        },
        extensions: config.svelte.extensions,
      }), 
      resolve({
        ...resolvePluginDefaults({
          browser: isCayo,
        }),
      }),
      ...defaultRollupPlugins(),
      ...userRollupPlugins(config),
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

  } catch (err) {
    let absoluteBase = type !== 'cayo' 
      ? config[`${type}s`] 
      : config.projectRoot;

    let relativeFilePath = input.replace(absoluteBase, '');
    let errorMessage = `Could not compile ${type}: '${relativeFilePath}'`;
    errorMessage += `\n> Rollup Error: ${err.code}`; 
    if (err.code === 'PLUGIN_ERROR') {
      errorMessage += `\n> ${err.plugin} (Error code: ${err.pluginCode})`;  
    }
    errorMessage += `\n\n> Source: ${input}`;
    errorMessage += `\n${err.frame}`
    errorMessage += `\n> ${err.stack}`;

    throw new Error(errorMessage, { cause: err });
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
