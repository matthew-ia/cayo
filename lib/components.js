import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { Renderer } from './renderer.js';
import { compileTemplate } from './template.js';
import { getComponentDependencies, resolveImports } from './utils.js';

export async function compileComponents(componentPaths, config) {
  const { pages } = config;
  const compiledComponents = [];

  if (componentPaths === null) {
    componentPaths = await getModulePaths(pages);
  }

  for await (const componentPath of componentPaths) {
    try {
      const source = await fs.readFile(componentPath, 'utf8');
      compiledComponents.push(await compileComponent(source, componentPath, config));
    } catch (err) {
      console.log(err);
    }
  }

  return compiledComponents;
}

export async function compileComponent(source, filepath, config) {
  let filename = filepath.split('/').pop();
  const component = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js,
    css,
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

  const { dependencies, code } = resolveImports(js.code, config);
  const depender = { path: filepath, dependencies };

  // TODO: with dependencies, go compile any svelte components if they don't already exist
  //       THEN run the page's compile

  let outputPath = path.resolve(config.cayoPath, `./__cayo/components/${filename.replace('.svelte', '.svelte.js')}`);

  try {
    await fse.outputFile(outputPath, code);
    const Component = (await import(outputPath)).default;
    const { html, css } = Component.render();
    return { html, css, depender };

  } catch (err) {
    console.error(`Error compiling page: ${filename}\n`, err);
  }
}



async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}

// 1. Start Watching pages
// 2. Page A changes
// 3. Re-compile Page A




