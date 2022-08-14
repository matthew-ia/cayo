import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { logger } from '../core/logger.js';
import * as compile from '../core/compile/index.js';
import { findDependentPages } from '../core/compile/dependencies.js';
import { 
  writePageFiles,
} from '../core/files.js';

export function watch(_cayo) {
  const { config } = _cayo;

  const watcher = chokidar.watch(config.src, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });

  const configWatcher = chokidar.watch(path.resolve(config.projectRoot, './cayo.config.js'));

  configWatcher.on('change', (filepath) => {
    logger.log.info(
      chalk.yellow(`config updated... restart dev server to use new config.`),
      { timestamp: true, clear: true, }
    );
  })

  const logChange = (type, filepath = '') => {
    if (filepath !== '') {
      if (type === 'component' || 'cayo') {
        filepath = filepath.replace(config.components, '');
      } else if (type === 'page') {
        filepath = filepath.replace(config.pages, '');
      }
    }
    
    logger.log.info(
      `${type} updated ${chalk.dim(filepath)}`,
      { timestamp: true, clear: true, }
    );
  }

  // TODO: watch other files in src
  //       maybe add stats.watchFiles where every dep is added,
  //       and then use that in watch

  // TODO: check if I'd need to watch any other file types (.css, .js, etc., probably, right?)

  watcher.on('change', async (filepath) => {
    if (filepath.endsWith('.svelte')) {
      // Handle Template
      if (filepath.endsWith(`${config.templateName}.svelte`)) {
        logChange('template');
        // Recompile and render template
        const Layout = await compile.layout(config);
        _cayo.layout = await Layout.render(true);
        // Recompile and render all pages
        await compile.pages(null, _cayo);
        // TODO: update this
        for (const page of _cayo.pages) {
          console.log('cayoComponents', _cayo.stats.cayoComponents);
          page.render(_cayo.stats.cayoComponents, { load: true });
        }

      } else if (filepath.startsWith(config.pages)) {
        logChange('page', filepath);
        // Handle Pages
        await handlePage(filepath, _cayo);
      
      // Handle Cayos
      } else if (filepath.includes(`.${config.cayoComponentInfix}`)) {
        logChange('cayo', filepath);
        await handleCayo(filepath, _cayo);

      // Handle Components
      } else if (filepath.startsWith(config.components)) {
        logChange('component', filepath);
        await handleComponent(filepath, _cayo);
      } else {
        // TODO: what happens?
        // prerenderPages(config);
      }
    }
  });
  // watcher.close();
}

async function handleCayo(filepath, _cayo) {
  try {
    await compile.cayos(null, _cayo);
    handleComponent(filepath, _cayo);
  } catch (err) {
    logger.error(err);
  }
}

async function handleComponent(filepath, _cayo) {
  const dependentPages = findDependentPages(filepath, _cayo);
  for (const page of dependentPages) {
    handlePage(page, _cayo);
  }
}

async function handlePage(filepath, _cayo) {
  const { pages } = _cayo;

  try {
    const page = (await compile.pages([filepath], _cayo))[0];
    pages.set(filepath, page);
    await page.render(_cayo, { load: true });
    writePageFiles(page, _cayo);
  } catch (err) {
    logger.error(err);
  }
}