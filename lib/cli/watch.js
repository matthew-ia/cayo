import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { logger } from '../core/logger.js';
import * as compile from '../core/compile/index.js';
import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from '../core/files.js';

export function watch(config, _cayo) {

  const watcher = chokidar.watch(config.src, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });

  const configWatcher = chokidar.watch(path.resolve(config.projectRoot, './cayo.config.js'));

  configWatcher.on('change', (filepath) => {
    logger.log.info(
      chalk.yellow(`> config updated... restart dev server to use new config.`),
      { timestamp: true, clear: true, }
    );
  })

  const logChange = (type) => {
    logger.log.info(
      `> ${type} updated`,
      { timestamp: true, clear: true, }
    );
  }

  // TODO: watch other files in src
  //       maybe add stats.watchFiles where every dep is added,
  //       and then use that in watch

  // TODO: check if I'd need to watch any other file types (.css, .js, etc., probably, right?)
  // TODO: need to wrap writeModule and compile stuff in try-catch blocks

  // TODO: on initial run should I just scan the entire src directory and create a watch tree? :(
  // this would sorta be like the dep tree except it's only for watching changed files, and ensuring
  // new files get added to the watch tree. then, "go find the file in the dep tree and compile it's dependencies"
  // but then.. what would the watch tree actually be for? when it can already watch a whole dir. idk man
  watcher.on('change', async (filepath) => {
    if (filepath.endsWith('.svelte')) {
      // Handle Template
      if (filepath.endsWith(`${config.templateName}.svelte`)) {
        logChange('template');
        // Recompile and render template
        const Layout = await compile.layout(config);
        _cayo.layout = await Layout.render(true);
        // Recompile and render all pages
        await compile.pages(null, _cayo, cayoConfig);
        for (const page of _cayo.pages) {
          console.log('cayoComponents', _cayo.stats.cayoComponents);
          page.render(_cayo.stats.cayoComponents, { load: true });
        }
        
      
      } else if (filepath.startsWith(config.pages)) {
        logChange('page');
        // Handle Pages
        await handlePage(filepath, _cayo, config);
      
      // Handle Cayo Components
      } else if (filepath.includes(`.${config.cayoComponentInfix}`)) {
        logChange('cayo component');
        // compile.components([filepath], stats, config);
        // find out which pages are affected and recompile/render those
        // 2. render all affected pages

        // getCayoComponents(config)
        //   .then((components) => {
        //     let componentModule = Object.entries(components).find(([, { modulePath }]) => modulePath === filepath);
        //     handleCayoComponent(componentModule[0], componentModule[1].modulePath, config);
        //   })

      // Handle Components
      } else if (filepath.startsWith(config.components)) {
        logChange('component');
        console.log('watch handle: ', filepath);
        await handleComponent(filepath, _cayo, config);
        // compile.components([filepath], stats, config);
        // find out which pages are affected and recompile/render those
        // 2. render all affected pages

        // getPages(config)
        //   .then(() => {
        //     prerenderPages(config);
        //   })
  
      // TODO: watch component changes
      // } else if (componentFileChanged) {
      // find out which pages are affected
      // find out which components are affected (imports)?
      } else {
        // prerenderPages(config);
      }
    }
  });
  // watcher.close();
}

async function handleComponent(filepath, _cayo, config) {
  const { pages, stats } = _cayo;
  console.log('handling', filepath);

  for (const [pagePath, pageDeps] of Object.entries(stats.dependencies.pages)) {
    if (pageDeps.has(filepath)) {
      handlePage(pagePath, _cayo, config)

      // TODO: figure out how to handle nested dependencies, e.g. B inside of A, and A is in Page.
      //       when B changes, it should rerender Page.
      // const [page] = findPage(pagePath, pages);
      // console.log('branch', getDependencyBranch(page.sourcePath, stats.dependencies), '\n\n');
      // try {
      //   await page.render(true, stats.cayoComponents);
      //   writePageFiles(page, config.cayoPath, config);
      // } catch (err) {
      //   console.error('brrrrrr');
      // }
    }
  }

  


  // related to the nested deps thing, I think this code is off
  // because dependent components don't need to be recompiled, the page just needs a rerender
  // const components = [];
  // for (const [componentPath, componentDeps] of Object.entries(stats.dependencies.components)) {
  //   if (componentDeps.has(filepath)) {
  //     components.push(componentPath);
  //   }
  // }
  // if (components.length > 0) {
  //   compile.components(components, _cayo, config);
  // }

  

  // const dependentPages = [...stats.dependencies.pages].filter(deps => 
  //   deps.has(filepath)
  // );
  // const dependentComponents = stats.dependencies.components.filter(deps => 
  //   deps.has(filepath)
  // );

  // for (const page of dependentPages) {
  //   await handlePage(page.sourcePath, _cayo, config);
  // }

  // for (const dep of [...component.dependencies]) {

  // }

  // await compile.pages(dependentPages, _cayo, config);
  // rerender


}

async function handlePage(filepath, _cayo, config) {
  const { pages, stats } = _cayo;

  pages.set(filepath, (await compile.pages([filepath], _cayo, config))[0]);
  const page = pages.get(filepath);
  // TODO: do this here?
  await page.render(_cayo, { load: true });
  writePageFiles(page, config.cayoPath, config);
}