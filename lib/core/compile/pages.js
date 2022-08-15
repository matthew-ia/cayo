import fs from 'fs-extra';
import fg from 'fast-glob';
import path from 'path';

import { handleDependencies } from './dependencies.js';
import { Page } from '../page.js';
import { build } from '../bundle.js';
import { logger } from '../logger.js';

export async function compilePages(pageModulePaths, _cayo) {
  const compiledPages = [];

  if (pageModulePaths === null) {
    pageModulePaths = await getModulePaths(_cayo.config.pages);
  }

  for await (const pagePath of pageModulePaths) {
    compiledPages.push(
      await compilePage(pagePath, _cayo)
    );
  }

  return compiledPages;
}

async function compilePage(filepath, _cayo) {
  const { template, config } = _cayo;
  let filename = filepath.replace(`${config.pages}`, '');

  const { code, dependencies } = await build(filepath, config);

  const depender = { 
    type: 'page', 
    path: filepath, 
    dependencies: dependencies 
  }
  
  try {
    // Create the dependency tree for this page
    // (This dep tree includes components that are children and nested children)
    await handleDependencies(depender, _cayo);

    // TODO: configure output path base in internal cayoConfig?
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/pages/${filename.replace('.svelte', '.svelte.js')}`
    );
    await fs.outputFile(outputPath, code);

    const page = new Page(code, template, filepath, outputPath, dependencies, config);
    _cayo.pages.set(filepath, page);

    return page;

  } catch (err) {
    logger.error(`Error compiling page: ${filename}\n`, err);
  }
}


async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}


