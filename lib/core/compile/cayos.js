import fs from 'fs-extra';
import path from 'path';

import { handleDependencies } from './dependencies.js';
import { Component } from '../component.js';
import { build } from '../bundle.js';
import { generateCayoComponentId } from '../utils.js';

export async function compileCayos(components, _cayo) {
  const compiledComponents = [];

  if (components === null) {
    components = Object.entries(_cayo.stats.cayoComponents);
  } else {
    // Assume we got a list of paths, and need to convert it
    // into the format for stats.cayoComponents
    let _components = [...components];
    components = {};

    for (const c of _components) {
      const { name } = generateCayoComponentId(
        c.replace(_cayo.config.components, '')
      );
      components[name] = _cayo.stats.cayoComponents[name];
    }
    components = Object.entries(components);
  }

  for (const [name, { src }] of components) {
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
    await fs.outputFile(outputPath, code);

    // Create new Component object and add it to the runtime object
    const component = new Component(name, code, filepath, outputPath, dependencies, config);
    _cayo.components.set(filepath, component);

    return component;

  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}

