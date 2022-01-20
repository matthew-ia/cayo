import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { Renderer } from './renderer.js';
import { compileTemplate } from './template.js';
import { getComponentDependencies, resolveImports } from './utils.js';

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
      compiledPages.push(await compilePage(source, pageModulePath, renderer, config));
    } catch (err) {
      console.log(err);
    }
  });

  return compiledPages;
}

export async function compilePage(source, filepath, renderer, config) {
  let filename = filepath.split('/').pop();
  // console.log(filename);
  const page = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js,
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
    console.log(filename, 'as warnings...');
    // console.log(warnings);
  }

  const { dependencies, code } = resolveImports(js.code, config);
  console.log(dependencies);

  // TODO: with dependencies, go compile any svelte components if they don't already exist
  //       THEN run the page's compile
  // return;

  let componentPath = path.resolve(config.cayoPath, `./components/${filename.replace('.svelte', '.svelte.js')}`);
  const PageComponent = await fse.outputFile(componentPath, code).then(async () => {
    return (await import(componentPath)).default;
  }).catch(err => console.error(err));
  
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




