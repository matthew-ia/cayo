import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { compileComponents } from './components.js';
import { handleDependencies, resolveImports } from './dependencies.js';

export async function compilePages(pageModulePaths, stats, config) {
  const { pages } = config;
  const compiledPages = [];

  if (pageModulePaths === null) {
    pageModulePaths = await getModulePaths(pages);
  }

  for await (const pagePath of pageModulePaths) {
    try {
      const source = await fs.readFile(pagePath, 'utf8');
      compiledPages.push(
        await compilePage(source, pagePath, stats, config)
      );
    } catch (err) {
      console.log(err);
    }
  }

  return { compiledPages, stats };
}

async function compilePage(source, filepath, stats, config) {
  let filename = filepath.split('/').pop();
  // TODO: Hide warnings from svelte-preprocess?
  // Maybe queue all the messages, and then only print the ones that
  // aren't "The file '/index.js' was not found." type ones

  // Preprocess the page
  const page = await preprocess(source, sveltePreprocess(), { filename });
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

  // Get the page component dependencies (components imported into it)
  const { dependencies: pageDependencies, code } = resolveImports(js.code, filepath, config);
  const depender = { path: filepath, dependencies: pageDependencies };
  
  

  // TODO: assume Cayo.svelte is a dependency, and always make sure it's in the .cayo folder
  //       (don't need to rebuild or watch it, since it's part of the package and won't change,
  //       except potentially between versions)

  // TODO: with dependencies, go compile any svelte components if they don't already exist
  //       THEN run the page's compile

  
  try {
    // Create the dependency tree for this page
    // (This dep tree includes components that are children and nested children)
    await handleDependencies(depender, stats, compileComponents, config);

    // TODO: configure output path base in internal cayoConfig?
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/pages/${filename.replace('.svelte', '.svelte.js')}`
    );
    await fse.outputFile(outputPath, code);

    // const PageComponent = await import(outputPath);
    // const { html, css } = renderer.render({ Component: PageComponent }, config);

    // return { name: filename, path: filepath, html, css, dependencies: depender.dependencies };
    // console.log(depender);
    return { depender, outputPath };

  } catch (err) {
    console.error(`Error compiling page: ${filename}\n`, err);
  }
}


async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}


