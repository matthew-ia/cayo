import fs from 'fs-extra';
import { rollup } from 'rollup';
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';
import json from '@rollup/plugin-json';

function inputOptions(input) {
  return { 
    input,
    onwarn: function ( message ) {
      if ( /external dependency/.test( message ) ) return;
    },
  };
}

function resolvePluginDefaults(overrides = {}) {
  return {
    browser: false,
    exportConditions: ['svelte'],
    extensions: ['.svelte'],
    dedupe: ['svelte'],
    ...overrides,
  }
}

function sveltePluginDefaults() {
  return {
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

function getUserDefinedPreprocessors(config) {
  return config.svelte.preprocess.length > 0 
    ? config.svelte.preprocess 
    : [config.svelte.preprocess];
}

export async function getDeps(input, config) {
  let bundle;
  let preprocessors = getUserDefinedPreprocessors(config);

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
    css: 'external',
    runes: false,
    modernAst: false,
    compatibility: {
      componentApi: 4, // Enable Svelte 4 component API compatibility
    },
  }

  let bundle;
  let output = {
    js: { code: '' },
    css: { code: '' },
    dependencies: [],
  };
  let preprocessors = getUserDefinedPreprocessors(config);

  // Filter out deprecated compiler options that might cause Svelte 5 issues
  const { format, legacy, ...cleanUserOptions } = config.svelte.compilerOptions || {};
  
  // Log warnings for deprecated options
  if (format !== undefined) {
    console.warn('[cayo] Warning: "format" compiler option is deprecated and will be ignored.');
  }
  if (legacy !== undefined) {
    console.warn('[cayo] Warning: "legacy" compiler option is deprecated and will be ignored.');
  }

  const options = { 
    ...inputOptions(input),
    plugins: [
      ...defaultRollupPlugins(),
      svelte({
        preprocess: [
          ...preprocessors,
        ],
        ...sveltePluginDefaults(),
        emitCss: false,
        compilerOptions: {
          preserveWhitespace: true,
          ...cleanUserOptions,  // Use filtered options
          ...requiredCompilerOptions,
        },
        extensions: config.svelte.extensions,
      }), 
      resolve({
        ...resolvePluginDefaults({
          browser: isCayo,
        }),
      }),
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
