import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import path from 'path';

import { handleDependencies } from './dependencies.js';
import { Component } from '../component.js';
import { build } from '../bundle.js';

export async function compileCayos(components, _cayo) {
  const compiledComponents = [];

  if (components === null) {
    components = Object.entries(_cayo.stats.cayoComponents);
  }

  for await (const [name, { src }] of components) {
    compiledComponents.push(
      await compileCayo(name, src, _cayo)
    );
  }

  return compiledComponents;
}

export async function compileCayo(name, filepath, _cayo) {
  const { config } = _cayo;
  let filename = filepath.replace(`${config.components}`, '');
  const { code, dependencies } = await build(filepath, config, 'component');
  
  const depender = { 
    type: 'component', 
    path: filepath, 
    dependencies,
  }
  
  try {
    await handleDependencies(depender, _cayo);
    
    // Write bundle to a file
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/components/${name}.svelte.js`
    );
    await fse.outputFile(outputPath, code);

    // Create new Component object and add it to the runtime object
    const component = new Component(name, code, filepath, outputPath, dependencies, config);
    _cayo.components.set(filepath, component);

    return component;

  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}

