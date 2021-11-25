import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import path from 'path';
import chalk from 'chalk';
import merge from 'deepmerge';
import { createServer, createLogger, build as viteBuild } from 'vite';
import { loadConfig, checkConfigPaths } from '#lib/config';
import { prerender } from '#lib/prerender';
import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from '#lib/files';
import { 
  hash,
  getPageModules, 
  getComponentModules,
  createTemplateManifest,
  createPageManifest,
  createComponentManifest,
} from '#lib/utils';

const logger = createLogger('info', {
  prefix: chalk.magenta.bold('[cayo]'),
  // allowClearScreen: true,
});
const errorLogger = createLogger('warn', {
  prefix: chalk.red.bold('[cayo]'),
  // allowClearScreen: true,
});

const data = {
  template: undefined,
  pages: undefined,
  components: undefined,
}

// / Handle arguments
function resolveArgs(argv) {
  const cmd = argv._[2];

  const options = {
    projectRoot: typeof argv.projectRoot === 'string' ? argv.projectRoot : undefined,
    configPath: typeof argv.config === 'string' ? argv.config : undefined,
    mode: cmd === 'build' ? 'production' : 'development',
  }

  switch (cmd) {
    case 'build':
    case 'dev':
    case 'help':
      return { cmd: cmd, options };
    default:
      return { cmd: 'help', options };
  }
}

function printHelp() {
  // TODO: help info
  console.log('help');
}

// Run
export async function cli(args) {
  const argv = yargs(args);
  const command = resolveArgs(argv);

  switch(command.cmd) {
    case 'dev':
    case 'build':
      run(command);
      break;
    case 'help':
    default:
      printHelp();
  }
}

const commands = new Map([
  ['build', async (config) => {
    await prerenderPages(config).then((pages)=> {
      build(config, pages);
    });
  }],
  ['dev', (config) => {
    prerenderPages(config);
    watch(config);
    serve(config);
  }]
]);

async function run(command) {
  const { cmd, options } = command;

  logger.info(
    `\n  ${chalk.magenta.bold(`cayo.${cmd}`)}${chalk.dim(` starting`)}`, 
    { timestamp: false }
  );

  try {
    const config = await loadConfig(options);
    checkConfigPaths(config, errorLogger);

    // Create a fresh cayo folder for this run
    cleanCayoPath(config.cayoPath);

    getTemplate(config)
      .then(() => getPages(config))
      .then(() => getCayoComponents(config))
      .then((components) => {
        handleCayoComponents(components, config);
      })
      .then(() => {
        const runCommand = commands.get(cmd);
        runCommand(config);   
      });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function getTemplate(config) {
  const { src, cayoPath, templateFileName } = config;
  return createTemplateManifest(path.resolve(src, `${templateFileName}.svelte`), cayoPath)
    .then(async () => {
      const { Template } = await import(path.resolve(cayoPath, `./__cayo/template.js?v=${hash()}`)) 
      data.template = Template;
      return data.template;
    });
}

async function getPages(config) {
  const { pages, cayoPath } = config;
  return createPageManifest(pages, cayoPath)
    .then(async () => await import(path.resolve(cayoPath, `./__cayo/pages.js?v=${hash()}`)))
    .then(({ pages }) => {
      data.pages = getPageModules(pages, config);
      return data.pages;
    });
}

async function getCayoComponents(config) {
  const { src, cayoPath } = config;
  return createComponentManifest(src, cayoPath)
    .then(async () => await import(path.resolve(cayoPath, `./__cayo/components.js?v=${hash()}`)))
    .then(({ components }) => {
      data.components = getComponentModules(components, config);
      return data.components;
    });
}

function watch(config) {

  const watcher = chokidar.watch(config.src, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });

  const configWatcher = chokidar.watch(path.resolve(config.src, '../cayo.config.js'));
  configWatcher.on('change', (filePath) => {
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

  watcher.on('change', async (filePath) => {
    if (filePath.endsWith('.svelte')) {
      if (filePath.endsWith(`${config.templateFileName}.svelte`)) {
        logChange('template')
        getTemplate(config)
          .then(() => prerenderPages(config));

      } else if (filePath.startsWith(config.pages)) {
        logChange('page');
        getPages(config)
          .then((pages) => {
            let pageModule = Object.entries(pages).find(([, { modulePath }]) => modulePath === filePath);
            let page = pageModule ? { [`${pageModule[0]}`]: pageModule[1] } : {}
            prerenderPages(config, page);
          })

      } else if (filePath.includes(`.${config.cayoComponentInfix}`)) {
        logChange('cayo component');
        getCayoComponents(config)
          .then((components) => {
            let componentModule = Object.entries(components).find(([, { modulePath }]) => modulePath === filePath);
            handleCayoComponent(componentModule[0], componentModule[1].modulePath, config);
          })
      // TODO: watch component changes
      // } else if (componentFileChanged) {
      // find out which pages are affected
      // find out which components are affected (imports)?
      } else {
        prerenderPages(config);
      }
    }
  });
  // watcher.close();
}

async function serve(config) {

  const internalConfig = {
    root: config.cayoPath, 
    publicDir: config.publicDir,
    mode: config.mode,
    configFile: false,
  } 

  const mergedConfig = merge(config.viteConfig, internalConfig);
  
  const server = await createServer({
    ...mergedConfig,
  })

  await server.listen()
}

async function build(config, pages) {

  // Create inputs for rollup based on the pages
  const inputs = {};

  for (const [, page] of Object.entries(pages)) {
    if (page.filePath === 'index') {
      inputs['main'] = path.resolve(config.cayoPath, 'index.html');
    } else {
      inputs[page.filePath] = path.resolve(config.cayoPath, `${page.filePath}/index.html`);
    }
  }

  const internalConfig = {
    root: config.cayoPath, 
    publicDir: config.publicDir,
    base: config.base,
    mode: config.mode,
    build: {
      outDir: config.build.outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: { ...inputs },
      }
    },
  };

  const mergedConfig = merge(config.viteConfig, internalConfig);

  return await viteBuild({
    ...mergedConfig,
  })
}

async function prerenderPages(config, pages = data.pages) {
  const { template: Template, components } = data;
  const { prerendered, template } = prerender(Template, pages, components, config, logger);

  for (const [, page] of Object.entries(prerendered)) {
    await writePageFiles(page, config.cayoPath, logger, config);
  }

  // Does nothing, if no CSS generated by template file render
  await writeTemplateCSS(template.css, config.cayoPath, logger, config);

  return prerendered;
}

async function handleCayoComponent(name, modulePath, config) {
  writeComponentFile(name, modulePath, config.cayoPath, logger);
}

async function handleCayoComponents(components = data.components, config) {
  Object.keys(components).forEach(name => {
    let component = components[name];
    handleCayoComponent(name, component.modulePath, config);
  })
}

cli(process.argv);
