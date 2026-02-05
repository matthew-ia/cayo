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
    external: (id) => id === 'svelte' || id.startsWith('svelte/'),
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
    emitCss: false, // Bundle CSS into JS instead of separate file
    onwarn: (warning, handler) => {
      // console.log('Svelte processing:', warning.filename);
      // console.log('Svelte warning:', warning.message);
      handler(warning);
    }
  }
}

function defaultRollupPlugins() {
  return [
    commonjs({
      include: /node_modules/,
    }), 
    css(), 
    json()
  ];
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
  const ssr = (type === 'page' || type === 'template');
  const isCayo = (type === 'cayo');
  const requiredCompilerOptions = {
    // Generic defaults for all builds
    preserveWhitespace: true,
  }

  if (ssr) {
    // Pages & Templates (SSR): server-side rendered
    requiredCompilerOptions.generate = 'ssr';
    requiredCompilerOptions.hydratable = false;
    
    if (type === 'template') {
      // Templates need comments preserved for Cayo placeholders
      requiredCompilerOptions.preserveComments = true;
    }
  } else {
    // Cayo Components (DOM): client-side hydration
    requiredCompilerOptions.generate = 'dom';
    requiredCompilerOptions.hydratable = true;
  }

  let bundle;
  let output = {
    js: { code: '' },
    css: { code: '' },
    dependencies: [],
  };
  let preprocessors = getUserDefinedPreprocessors(config);

  const options = { 
    ...inputOptions(input),
    plugins: [
      ...defaultRollupPlugins(),
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
