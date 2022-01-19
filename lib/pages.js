import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { Renderer } from './renderer.js';
import { compileTemplate } from './template.js';
import { getComponentDependencies } from './utils.js';

export async function compilePages(pageModulePaths, config) {
  const { pages } = config;
  const compiledPages = [];
  const template = await compileTemplate(config);
  const renderer = new Renderer(template);

  if (pageModulePaths === null) {
    pageModulePaths = await getModulePaths(pages);
  }

  pageModulePaths.forEach(async (pageModulePath) => {
    try {
      const source = await fs.readFile(pageModulePath, 'utf8');
      compiledPages.push(await compilePage(source, renderer));
    } catch (err) {
      console.log(err);
    }
  });

  return compiledPages;
}

export async function compilePage(source, renderer) {
  let filename = source.split('/').pop();
  // console.log(filename);
  const page = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js: PageComponent,
    warnings,
    stats 
  } = compile(page.code, {
    generate: 'ssr', 
    dev: true, // probably want this
    hydratable: true, // this is default, may need to be changed just fo Cayo components
    preserveComments: true, // optional, may be useful for dev
    preserveWhitespace: true, // optional, may be useful for dev  
  });

  // TODO: some helpful stuff with warnings and stats
  if (warnings) {
    console.log(filename, 'as warnings...')
  }

  // const dependencies = getComponentDependencies(stats.includedFiles);
  
  // first arg is the "page" object; page object would have some other stuff too, but for sake of brevity,
  // we're just passing the JS class we got from svelte.compile
  const { html, css } = renderer.render({ Component: PageComponent }, config);
  return { html, css, dependencies };
}



async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}

// 1. Start Watching pages
// 2. Page A changes
// 3. Re-compile Page A




