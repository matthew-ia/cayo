import { compile, preprocess, parse } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path from 'path';

import { compileComponents } from './components.js';
import { resolveCayoComponents, resolveDependencies, handleDependencies } from './dependencies.js';
import { Page } from '../page.js';
import { build, getDeps } from '../bundle.js';


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

  // Preprocess the page
  // const page = await preprocess(source, sveltePreprocess(), { filename });
  // const ast = parse(source);
  // FIXME: some of these resolveDependencies things just need to be part of 
  // a custom preprocessor plugin
  // const result = resolveDependencies(source, ast, filepath, _cayo.stats, config);
  // let outputPath = path.resolve(
  //   config.cayoPath, 
  //   `./__cayo/pages/${filename}`
  // );

  

  // await fse.outputFile(outputPath, result.source);
  // console.log(result.source);
  const bundle = await build(filepath, config);
  // console.log('ahhh', result);

  const processed = {
    code: bundle.code,
    dependencies: [...bundle.dependencies]
  }
  // const {
  //   js,
  //   ast,
  //   warnings,
  // } = compile(page.code, {
  //   generate: 'ssr', 
  //   dev: false, // probably want this
  //   hydratable: false, // this is default, may need to be changed just fo Cayo components
  //   preserveComments: true, // optional, may be useful for dev
  //   preserveWhitespace: true, // optional, may be useful for dev  
  // });


  // TODO: some helpful stuff with warnings and stats
  // if (warnings.length !== 0) {
  //   console.log(filename, 'has warnings...\n', warnings);
  // }

  // TODO: need to maintain a dependency tree, so we can know what things do/don't need to be recompiled
  //       when the watcher detects a change in a page or component

  // Get the page component dependencies (components imported into it)
  // const { dependencies, code } = resolveDependencies(js.code, ast, filepath, stats, config);

  const depender = { 
    type: 'page', 
    path: filepath, 
    dependencies: processed.dependencies 
  }
  
  try {
    // Create the dependency tree for this page
    // (This dep tree includes components that are children and nested children)
    // await handleDependencies(depender, _cayo, compileComponents, config);

    // TODO: configure output path base in internal cayoConfig?
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/pages/${filename.replace('.svelte', '.svelte.js')}`
    );

    // const svelteDeps = (await getDeps(filepath, config)).filter((path) => path !== filepath);
    // console.log('sdeps', svelteDeps);
    await fse.outputFile(outputPath, processed.code)

    // NOTE: this are the "true" module deps, but idk what to do with them
    // thinking
    // const bundleDeps = await getDeps(outputPath);
    // console.log('bdeps', bundleDeps);

    const deps = stats.dependencies.pages[filepath] 
      ? stats.dependencies.pages[filepath] 
      : depender.dependencies

    const page = new Page(processed.code, layout, filepath, outputPath, deps, config);
    _cayo.pages.set(filepath, page);
    // console.log('page', page);

    return page;

  } catch (err) {
    console.error(`Error compiling page: ${filename}\n`, err);
  }
}


async function getModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}


