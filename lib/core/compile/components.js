import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import path from 'path';

import { resolveDependencies, handleDependencies } from './dependencies.js';
import { Component } from '../component.js';
import { build, getDeps } from '../bundle.js';

export async function compileComponents(components, _cayo, config) {
  // const { stats, components } = _cayo;
  // TODO: might be able to optimize this to not run if it's triggered by a page, 
  // and we've already compiled all of its components
  const compiledComponents = [];

  if (components === null) {
    components = Object.entries(_cayo.stats.cayoComponents);
  }

  for await (const [name, { src }] of components) {
    try {
      // const source = await fs.readFile(src, 'utf8');
      compiledComponents.push(
        await compileComponent(name, src, _cayo, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return compiledComponents;
}

export async function compileComponent(name, filepath, _cayo, config) {
  const { stats } = _cayo;

  let filename = filepath.replace(`${config.components}`, '');

  // const deps = await getDeps(filepath, config);
  // TODO: Put this in try, I think, in case filepath doesn't exist?
  // FIXME: actually need these to be client side modules, and right now I'm getting
  //        SSR modules, I think
  const bundle = await build(filepath, config, 'component');
  
  const depender = { 
    type: 'component', 
    path: filepath, 
    dependencies: bundle.dependencies,
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
    
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/components/${name}.svelte.js`
    );

    await fse.outputFile(outputPath, bundle.code);

    // TODO: need to do this? or will stats always be enough
    const deps = stats.dependencies.components[filepath] 
      ? stats.dependencies.components[filepath] 
      : depender.dependencies
    

    const component = new Component(name, bundle.code, filepath, outputPath, deps, config);
    _cayo.components.set(filepath, component);

    return component;

  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}

