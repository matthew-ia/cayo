import { compile, preprocess } from 'svelte/compile';
import fg from 'fast-glob';
import path from 'path';

import { Renderer } from './renderer.js';
import { compileTemplate } from './template.js';

export async function compilePages(pageModulePaths, config) {
  const { pages } = config;
  const compiledPages = [];
  const template = await compileTemplate(config);
  const renderer = new Renderer(template);

  if (pageModulePaths === null) {
    pageModulePaths = await getModulePaths(pages);
  }

  pageModulePaths.forEach(async (pageModulePath) => {
    compiledPages.push(await compilePage(pageModulePath, renderer));
  });

  return compiledPages;
}

export async function compilePage(source, renderer) {
  let filename = source.split('/')[source.length - 1];
  return await preprocess(source, sveltePreprocess(), { filename }).then(page => {     
    const {
      js: PageComponent,
      warnings,
      stats 
    } = compile(page, {
      generate: 'ssr', 
      dev: true, // probably want this
      hydratable: false, // this is default, may need to be changed just fo Cayo components
      preserveComments: true, // optional, may be useful for dev
      preserveWhitespace: true, // optional, may be useful for dev  
    });

    // TODO: some helpful stuff with warnings and stats
    if (warnings) {
      console.log(filename, 'as warnings...')
    }
    
    // first arg is the "page" object; page object would have some other stuff too, but for sake of brevity,
    // we're just passing the JS class we got from svelte.compile
    return { html, css, stats } = renderer.render({ Component: PageComponent }, config);
  });
}

async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}

// 1. Start Watching pages
// 2. Page A changes
// 3. Re-compile Page A




