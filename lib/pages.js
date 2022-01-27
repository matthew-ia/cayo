import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { Renderer } from './renderer.js';
import { compileTemplate } from './template.js';
import { compileComponents } from './components.js';
import { handleDependencies, resolveImports } from './utils.js';

export async function compilePages(pageModulePaths, dependencies, config) {
  const { pages } = config;
  const compiledPages = [];
  const template = await compileTemplate(config);
  const renderer = new Renderer(template);

  const stats = {
    dependencies: dependencies || { },
    compiled: new Set(),
  }

  if (pageModulePaths === null) {
    pageModulePaths = await getModulePaths(pages);
  }

  for await (const pagePath of pageModulePaths) {
    try {
      const source = await fs.readFile(pagePath, 'utf8');
      compiledPages.push(
        await compilePage(source, pagePath, renderer, stats, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return { compiledPages, stats };
}

async function compilePage(source, filepath, renderer, stats, config) {
  let filename = filepath.split('/').pop();
  // TODO: Hide warnings from svelte-preprocess?
  // Maybe queue all the messages, and then only print the ones that
  // aren't "The file '/index.js' was not found." type ones
  // const consoleWarn = console.warn;
  // console.warn = () => { };
  const page = await preprocess(source, sveltePreprocess(), { filename });
  // console.warn = consoleWarn;
  const {
    js,
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

  // get page dependencies
  const { dependencies: pageDependencies, code } = resolveImports(js.code, filepath, config);
  const depender = { path: filepath, dependencies: pageDependencies };
  
  

  // TODO: assume Cayo.svelte is a dependency, and always make sure it's in the .cayo folder
  //       (don't need to rebuild or watch it, since it's part of the package and won't change,
  //       except potentially between versions)

  // TODO: with dependencies, go compile any svelte components if they don't already exist
  //       THEN run the page's compile

  let outputPath = path.resolve(config.cayoPath, `./__cayo/pages/${filename.replace('.svelte', '.svelte.js')}`);

  try {
    await handleDependencies(depender, stats, compileComponents, config);
    await fse.outputFile(outputPath, code);

    const PageComponent = await import(outputPath);
    const { html, css } = renderer.render({ Component: PageComponent }, config);

    // TODO: make this pass html and css actual values (rather than the boolean used for testing)
    return { name: filename, path: filepath, html, css, dependencies: depender.dependencies };

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




