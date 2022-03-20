import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { compileComponents } from './components.js';
import { resolveDependencies, handleDependencies } from './dependencies.js';
import { Page } from '../page.js';


export async function compilePages(pageModulePaths, _cayo, config) {
  const { pages } = config;
  const compiledPages = [];

  if (pageModulePaths === null) {
    pageModulePaths = await getModulePaths(pages);
  }

  for await (const pagePath of pageModulePaths) {
    try {
      const source = await fs.readFile(pagePath, 'utf8');
      compiledPages.push(
        await compilePage(source, pagePath, _cayo.layout, _cayo.stats, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return compiledPages;
}

async function compilePage(source, filepath, layout, stats, config) {
  let filename = filepath.replace(`${config.pages}`, '');

  // TODO: Hide warnings from svelte-preprocess?
  // Maybe queue all the messages, and then only print the ones that
  // aren't "The file '/index.js' was not found." type ones

  // Preprocess the page
  const page = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js,
    ast,
    warnings,
  } = compile(page.code, {
    generate: 'ssr', 
    dev: false, // probably want this
    hydratable: false, // this is default, may need to be changed just fo Cayo components
    preserveComments: true, // optional, may be useful for dev
    preserveWhitespace: true, // optional, may be useful for dev  
  });

  // TODO: some helpful stuff with warnings and stats
  if (warnings.length !== 0) {
    console.log(filename, 'has warnings...\n', warnings);
  }

  // TODO: need to maintain a dependency tree, so we can know what things do/don't need to be recompiled
  //       when the watcher detects a change in a page or component

  // Get the page component dependencies (components imported into it)
  const { dependencies, code } = resolveDependencies(js.code, ast, filepath, stats, config);
  const depender = { path: filepath, dependencies: dependencies };
  
  try {
    // Create the dependency tree for this page
    // (This dep tree includes components that are children and nested children)
    await handleDependencies(depender, stats, compileComponents, config);

    // TODO: configure output path base in internal cayoConfig?
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/pages/${filename.replace('.svelte', '.svelte.js')}`
    );
    
    return await fse.outputFile(outputPath, code).then(() => {
      return new Page(layout, filepath, outputPath, depender.dependencies, config);
    });

    

  } catch (err) {
    console.error(`Error compiling page: ${filename}\n`, err);
  }
}


async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}


