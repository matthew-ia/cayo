import { compile, preprocess, parse } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { handleDependencies } from './dependencies.js';
import { Page } from '../page.js';
import { build } from '../bundle.js';

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
        await compilePage(source, pagePath, _cayo, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return compiledPages;
}

async function compilePage(source, filepath, _cayo, config) {
  const { layout, stats } = _cayo;
  let filename = filepath.replace(`${config.pages}`, '');

  // TODO: Hide warnings from svelte-preprocess?
  // Maybe queue all the messages, and then only print the ones that
  // aren't "The file '/index.js' was not found." type ones
  
  // Shape: { code, dependencies } = bundle
  const bundle = await build(filepath, config);

  const depender = { 
    type: 'page', 
    path: filepath, 
    dependencies: bundle.dependencies 
  }
  
  try {
    // Create the dependency tree for this page
    // (This dep tree includes components that are children and nested children)
    await handleDependencies(depender, _cayo, config);

    // TODO: configure output path base in internal cayoConfig?
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/pages/${filename.replace('.svelte', '.svelte.js')}`
    );

    await fse.outputFile(outputPath, bundle.code)

    const deps = stats.dependencies.pages[filepath] 
      ? stats.dependencies.pages[filepath] 
      : depender.dependencies

    const page = new Page(bundle.code, layout, filepath, outputPath, deps, config);
    _cayo.pages.set(filepath, page);

    return page;

  } catch (err) {
    console.error(`Error compiling page: ${filename}\n`, err);
  }
}


async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}


