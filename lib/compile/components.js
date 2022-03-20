import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import path from 'path';

import { resolveDependencies, handleDependencies } from './dependencies.js';

export async function compileComponents(componentPaths, stats, config) {
  // TODO: might be able to optimize this to not run if it's triggered by a page, 
  // and we've already compiled all of its components
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
  let filename = filepath.replace(`${config.components}`, '');
  const component = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js,
    warnings,
    ast,
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

  const { dependencies, code } = resolveDependencies(js.code, ast, filepath, config);
  const depender = { path: filepath, dependencies };
  
  try {
    await handleDependencies(depender, stats, compileComponents, config);
    // Write the JS version of the component to a new file
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/components/${filename.replace('.svelte', '.svelte.js')}`
    );
    let astPath = path.resolve(
      config.cayoPath, 
      `./__cayo/components/ast/${filename.replace('.svelte', '.ast.json')}`
    );
    await fse.outputFile(outputPath, code);
    await fse.outputFile(astPath, JSON.stringify(ast, null, 2));
    
    return { depender, outputPath };

  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}

