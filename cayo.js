import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import path from 'path';
const __dirname = path.resolve();
import chalk from 'chalk';
import { createServer, createLogger, build as viteBuild } from 'vite';
import { prerender } from '#lib/prerender';
import { 
  writePageFiles,
  writeComponentFile,
} from '#lib/files';
import { 
  hash,
  getPageModules, 
  getComponentModules,
  createTemplateManifest,
  createPageManifest,
  createComponentManifest,
  getOutDir,
} from '#lib/utils';

import { loadConfig } from '#lib/config';

// vite stuff

// import { svelte } from '@sveltejs/vite-plugin-svelte';
// import sveltePreprocess from 'svelte-preprocess';

// const viteConfig = {
//   plugins: [svelte({
//     preprocess: sveltePreprocess({ preserve: ['json'] }),
//     compilerOptions: {
//       // generate: 'ssr',
//       hydratable: true,
//       // we'll extract any component CSS out into
//       // a separate file - better for performance
//       // css: css => {
//       //   css.write('dist/bundle.css'); // (3)
//       // },
//     },
//   })],
// }


const logger = createLogger('info', {
  prefix: chalk.magenta.bold('[cayo]'),
  // allowClearScreen: true,
});

// const config = {
//   projectRoot: path.resolve(process.cwd(), 'test'),
//   logger: logger,
//   outDir: path.join(process.cwd(), '.cayo/'),
//   css: {
//     useStyleTags: false,
//   },
//   depsInBody: false,
// }

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
  ['build', (config) => {
    prerenderPages(config).then(()=>{
      build(config);
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

    getTemplate(config)
    .then(() => getPages(config))
    .then(() => getCayoComponents(config))
    .then((components) => {
      handleCayoComponents(components, config);
    })
    .then(() => {
      const runCommand = commands.get(cmd);
      runCommand(config);
      // if (cmd === 'dev') {
      //   watch(config);
      //   serve(config);
      // }     
    });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function getTemplate(config) {
  const { src, cayoPath } = config;
  return createTemplateManifest(src, cayoPath)
    .then(async () => await import(path.resolve(cayoPath, `./__cayo/template.js?v=${hash()}`)))
    .then(({ Template }) => {
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
  const fileExt = '.svelte';
  const templateFileName = '__index' + fileExt;

  const watcher = chokidar.watch(config.src, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });

  const logChange = (type) => {
    logger.info(
      `> ${type} updated`,
      { timestamp: true, clear: true, }
    );
  }

  watcher.on('change', async (filePath) => {
    if (filePath.endsWith(fileExt)) {
      if (filePath.endsWith(templateFileName)) {
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
  const server = await createServer({
    configFile: false,
    clearScreen: false,
    server: {
      port: 5000,
    },
    // User config
    ...config.viteConfig,
    // Necessary cayo config values
    // These intentionally will override respective keys
    // in the user's vite config, if present
    root: config.cayoPath,
    publicDir: config.publicDir,
    mode: config.mode,
  })
  await server.listen()
}

async function build(config) {
  return await viteBuild({
    root: config.cayoPath,
    ...config.viteConfig,
  })
}

async function prerenderPages(config, pages = data.pages) {
  const { template, components } = data;
  const { prerendered } = prerender(template, pages, components, config, logger);

  Object.entries(prerendered).forEach(([, page]) => {
    writePageFiles(page, getOutDir(config), logger, config);
  });
}

async function handleCayoComponent(name, modulePath, config) {
  writeComponentFile(name, modulePath, getOutDir(config), logger);
}

async function handleCayoComponents(components = data.components, config) {

  Object.keys(components).forEach(name => {
    let component = components[name];
    handleCayoComponent(name, component.modulePath, config);
  })
  // let componentModule = Object.entries(components).find(([, { modulePath }]) => modulePath === filePath);
  // handleCayoComponent(componentModule[0], componentModule[1].modulePath, config, logger);
}

cli(process.argv);
