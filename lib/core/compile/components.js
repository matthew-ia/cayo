import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import path from 'path';

import { resolveDependencies, handleDependencies } from './dependencies.js';
import { Component } from '../component.js';
import { getDeps } from '../bundle.js';

export async function compileComponents(componentPaths, _cayo, config) {
  // const { stats, components } = _cayo;
  // TODO: might be able to optimize this to not run if it's triggered by a page, 
  // and we've already compiled all of its components
  const compiledComponents = [];

  for await (const componentPath of componentPaths) {
    try {
      const source = await fs.readFile(componentPath, 'utf8');
      compiledComponents.push(
        await compileComponent(source, componentPath, _cayo, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return compiledComponents;
}

export async function compileComponent(source, filepath, _cayo, config) {
  const { stats } = _cayo;

  let filename = filepath.replace(`${config.components}`, '');

  const deps = await getDeps(filepath, config);
  
  const depender = { 
    type: 'component', 
    path: filepath, 
    dependencies: deps,
  }
  
  try {
    // console.log('=== component', filepath);
    await handleDependencies(depender, _cayo, config);
    
    // Write the JS version of the component to a new file
    // TODO: create a utility function to get these output paths, 
    // for here and within dependencies.js
    // let outputPath = path.resolve(
    //   config.cayoPath, 
    //   `./__cayo/components/${filename.replace('.svelte', '.svelte.js')}`
    // );

    // await fse.outputFile(outputPath, code);

    // TODO: remove ast stuff once done w debugging
    // let astPath = path.resolve(
    //   config.cayoPath, 
    //   `./__cayo/components/ast/${filename.replace('.svelte', '.ast.json')}`
    // );
    // await fse.outputFile(astPath, JSON.stringify(ast, null, 2));
    
    const component = new Component(null, filepath, null, depender.dependencies, config);
    _cayo.components.set(filepath, component);

    // console.log('component', component);

    return component;

  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}

