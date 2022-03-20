import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { handleDependencies, resolveImports } from './dependencies.js';

export async function compileComponents(componentPaths, stats, config) {
  const compiledComponents = [];

  for await (const componentPath of componentPaths) {
    try {
      const source = await fs.readFile(componentPath, 'utf8');
      compiledComponents.push(
        await compileComponent(source, componentPath, stats, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return compiledComponents;
}

export async function compileComponent(source, filepath, stats, config) {
  let filename = filepath.split('/').pop();
  const component = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js,
    warnings,
  } = compile(component.code, {
    generate: 'ssr', 
    dev: true, // probably want this
    hydratable: true, // this is default, may need to be changed just fo Cayo components
    preserveComments: true, // optional, may be useful for dev
    preserveWhitespace: true, // optional, may be useful for dev  
  });

  // TODO: some helpful stuff with warnings and stats
  if (warnings.length !== 0) {
    console.log(filename, 'has warnings...\n', warnings);
  }

  const { dependencies, code } = resolveImports(js.code, filepath, config);
  const depender = { path: filepath, dependencies };

  // TODO: with dependencies, go compile any svelte components if they don't already exist
  //       THEN run the page's compile

  
  try {
    await handleDependencies(depender, stats, compileComponents, config);
    // Write the JS version of the component to a new file
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/components/${filename.replace('.svelte', '.svelte.js')}`
    );
    await fse.outputFile(outputPath, code);
    
    return { depender, outputPath };

  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}



