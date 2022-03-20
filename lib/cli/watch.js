import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { logger } from '../logger.js';
import * as compile from '../compile/index.js';
import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from '../files.js';

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
    logger.error.info(
      `> ${type} updated`,
      { timestamp: true, clear: true, }
    );
  }

  watcher.on('change', async (filepath) => {
    if (filepath.endsWith('.svelte')) {
      // Handle Template
      if (filepath.endsWith(`${config.templateName}.svelte`)) {
        logChange('template')
        const Layout = await compile.layout(config);
        _cayo.layout = await Layout.render(true);
        // 2. render all pages
        _cayo.pages = await compile.pages(null, _cayo, cayoConfig);
        for (const page of _cayo.pages) {
          page.render(true, _cayo.stats.cayoComponents);
        }
      
      // Handle Pages
      } else if (filepath.startsWith(config.pages)) {
        // If new page, run make sure compilepages is run on it
        logChange('page');
        // TODO: might need to build page object and return it from compile instead of the old way
        // but not it'll include the dependencies
        // console.log('watching page', filepath, _cayo.pages.length);
        const index = _cayo.pages.findIndex(page => page.sourcePath === filepath);
        // console.log('finding page', index);
        let sourcePath = _cayo.pages[index].sourcePath;
        _cayo.pages[index] = (await compile.pages([sourcePath], _cayo, config))[0];
        await _cayo.pages[index].render(true, _cayo.stats.cayoComponents);
        writePageFiles(_cayo.pages[index], config.cayoPath, config);
        
        
        // _cayo.pages = await compile.pages(null, _cayo, cayoConfig);
        // pages = compile.pages([filepath], stats, config);
        // 2. render this page
        // prerender(layout, [pages[filepath]], config, logger);

        // getPages(config)
        //   .then((pages) => {
        //     let pageModule = Object.entries(pages).find(([, { modulePath }]) => modulePath === filepath);
        //     let page = pageModule ? { [`${pageModule[0]}`]: pageModule[1] } : {}
        //     prerenderPages(config, page);
        //   })

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