import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import path from 'path';
const __dirname = path.resolve();
import chalk from 'chalk';
import { createServer, createLogger } from 'vite';
import { prerender } from './src/prerender.js';
import { 
  writePageFiles,
  writeComponentFile,
} from './src/files.js';
import { 
  hash,
  getPageModules, 
  getComponentModules,
  createTemplateManifest,
  createPageManifest,
  createComponentManifest,
} from './src/utils.js';

// vite stuff

import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

const viteConfig = {
  plugins: [svelte({
    preprocess: sveltePreprocess({ preserve: ['json'] }),
    compilerOptions: {
      // generate: 'ssr',
      hydratable: true,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      // css: css => {
      //   css.write('dist/bundle.css'); // (3)
      // },
    },
  })],
}


const logger = createLogger('info', {
  prefix: chalk.magenta('[cayo]'),
  // allowClearScreen: true,
});

const config = {
  projectRoot: path.resolve(process.cwd(), 'test'),
  logger: logger,
  outDir: path.join(process.cwd(), '.cayo/'),
  css: {
    useStyleTags: false,
  },
  depsInBody: false,
}

const options = {
  outDir: path.join(process.cwd(), '.cayo/'),
}

const data = {
  template: undefined,
  pages: undefined,
  components: undefined,
}

const cayoPath = path.join(process.cwd(), '.cayo/');

// / Handle arguments
function resolveArgs(argv) {

  const cmd = argv._[2]
  const options = {
    //TODO: support options from command line
  }

  switch (cmd) {
    case 'dev':
      return { cmd: 'dev', options };
    case 'build':
      return { cmd: 'build', options };
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
  // TODO: do something with options

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

async function run({ cmd }) {
  logger.info(`\n  ${chalk.magenta.bold(`cayo.${cmd}`)}${chalk.dim(` starting`)}`, { timestamp: false });

  getTemplate(config.projectRoot, cayoPath)
    .then(() => getPages(config.projectRoot, cayoPath))
    .then(() => getCayoComponents(config.projectRoot, cayoPath))
    .then(() => {
      build();
      if (cmd === 'dev') {
        watch();
        serve();
      }     
    });
}

async function getTemplate(projectRoot, cayoPath) {
  return createTemplateManifest(projectRoot, cayoPath)
    .then(async () => await import(path.resolve(cayoPath, `generated/template.js?v=${hash()}`)))
    .then(({ Template }) => {
      data.template = Template;
      return data.template;
    });
}

async function getPages(projectRoot, cayoPath) {
  return createPageManifest(projectRoot, cayoPath)
    .then(async () => await import(path.resolve(cayoPath, `generated/pages.js?v=${hash()}`)))
    .then(({ pages }) => {
      data.pages = getPageModules(pages);
      // data.components = getComponentModules(components);

      return data.pages;
    });
}

async function getCayoComponents(projectRoot, cayoPath) {
  return createComponentManifest(projectRoot, cayoPath)
    .then(async () => await import(path.resolve(cayoPath, `generated/components.js?v=${hash()}`)))
    .then(({ components }) => {
      data.components = getComponentModules(components);
      return data.components;
    });
}

function watch() {
  const watcher = chokidar.watch(`${config.projectRoot}/src`, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });
  watcher.on('change', async (filePath) => {
    
    if (filePath.endsWith('.svelte')) {
      if (filePath.endsWith('__index.svelte')) {
        config.logger.info(
          '> template updated',
          { timestamp: true, clear: true, }
        );
        getTemplate(config.projectRoot, cayoPath)
          .then(() => build());
      } else if (filePath.startsWith(path.resolve(config.projectRoot, 'src/pages'))) {
        config.logger.info(
          '> page updated', 
          { timestamp: true, clear: true, }
        );
        getPages(config.projectRoot, cayoPath)
          .then((pages) => {
            let pageModule = Object.entries(pages).find(([, { modulePath }]) => modulePath === filePath);
            let page = pageModule ? { [`${pageModule[0]}`]: pageModule[1] } : {}
            build(page);
          })
      } else if (filePath.includes('.cayo')) {
        config.logger.info(
          '> cayo component updated',
          { timestamp: true, clear: true, }
        );
        getCayoComponents(config.projectRoot, cayoPath)
          .then((components) => {
            let componentModule = Object.entries(components).find(([, { modulePath }]) => modulePath === filePath);
            // let component = componentModule ? { [`${componentModule[0]}`]: componentModule[1] } : {};
            handleCayoComponent(componentModule[0], componentModule[1].modulePath);
            // build(data.pages, true);
          })
      // TODO: watch component changes
      // } else if (componentFileChanged) {
      // find out which pages are affected
      // find out which components are affected (imports)?
      } else {
        build();
      }
    }
  });
  // watcher.close();
}

async function serve() {
  const server = await createServer({
    // any valid user config options, plus `mode` and `configFile`
    configFile: false,
    clearScreen: false,
    root: '.cayo',
    server: {
      port: 5000
    },
    ...viteConfig,
  })
  await server.listen()
}

async function build(pages = data.pages) {
  const { prerendered, componentList } = prerender(data.template, pages, config);
  Object.entries(prerendered).forEach(([, page]) => {
    writePageFiles(page, config, config.outDir)
  });
}

async function handleCayoComponent(name, modulePath) {
  writeComponentFile(name, modulePath, config)
}

cli(process.argv);
