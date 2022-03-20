import chokidar from 'chokidar';

function watch(config, compile, prerender, logger, CAYO) {
  const { layout, pages, stats } = CAYO;

  const watcher = chokidar.watch(config.src, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });

  const configWatcher = chokidar.watch(path.resolve(config.projectRoot, './cayo.config.js'));
  configWatcher.on('change', (filepath) => {
    logger.info(
      chalk.yellow(`> config updated... restart dev server to use new config.`),
      { timestamp: true, clear: true, }
    );
  })

  const logChange = (type) => {
    logger.info(
      `> ${type} updated`,
      { timestamp: true, clear: true, }
    );
  }

  watcher.on('change', async (filepath) => {
    if (filepath.endsWith('.svelte')) {
      if (filepath.endsWith(`${config.templateName}.svelte`)) {
        logChange('template')
        await compile.layout(config);
        // 2. render all pages
        pages = compile.pages(null, stats, config);
        prerender(layout, pages, config, logger);
        // getTemplate(config)
        //   .then(() => prerenderPages(config));

      } else if (filepath.startsWith(config.pages)) {
        logChange('page');
        // TODO: might need to build page object and return it from compile instead of the old way
        // but not it'll include the dependencies
        pages = compile.pages([filepath], stats, config);
        // 2. render this page
        prerender(layout, [pages[filepath]], config, logger);

        // getPages(config)
        //   .then((pages) => {
        //     let pageModule = Object.entries(pages).find(([, { modulePath }]) => modulePath === filepath);
        //     let page = pageModule ? { [`${pageModule[0]}`]: pageModule[1] } : {}
        //     prerenderPages(config, page);
        //   })

      } else if (filepath.includes(`.${config.cayoComponentInfix}`)) {
        logChange('cayo component');
        compile.components([filepath], stats, config);
        // find out which pages are affected and recompile/render those
        // 2. render all affected pages

        // getCayoComponents(config)
        //   .then((components) => {
        //     let componentModule = Object.entries(components).find(([, { modulePath }]) => modulePath === filepath);
        //     handleCayoComponent(componentModule[0], componentModule[1].modulePath, config);
        //   })
      } else if (filepath.startsWith(config.components)) {
        logChange('component');
        compile.components([filepath], stats, config);
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