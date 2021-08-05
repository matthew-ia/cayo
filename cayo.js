import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import path from 'path';
import { createServer } from 'vite';
import { createLogger } from 'vite';
const __dirname = path.resolve();
import chalk from 'chalk';
import { prerender } from './src/prerender.js';
import { 
  hash,
  getPageModules, 
  getComponentModules,
  createTemplateManifest,
  createPageManifest,
} from './src/utils.js';


const logger = createLogger('info', {
  prefix: chalk.magenta('[cayo]'),
  allowClearScreen: false,
});

const config = {
  projectRoot: path.resolve(process.cwd(), 'test'),
  logger: logger,
  outDir: path.join(process.cwd(), '.cayo/'),
}

const options = {
  outDir: path.join(process.cwd(), '.cayo/'),
}

const data = {}

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
  logger.info(chalk.magenta('\n  cayo ') + chalk.green(`${cmd}`), { timestamp: false });

  getTemplate(config.projectRoot, cayoPath)
    .then(() => getPages(config.projectRoot, cayoPath))
    .then(() => prerender(data.template, data.pages, config))
    .then(() => {
      if (cmd === 'dev') {
        watch();
        serve();
      }     
    });
  
  // if (cmd === 'dev') {
  //   watch();
  //   serve();
  // } 
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
      return data.pages;
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
        getTemplate(config.projectRoot, cayoPath)
          .then(() => prerender(data.template, data.pages, config));
      } else if (filePath.startsWith(path.resolve(config.projectRoot, 'src/pages'))) {
        getPages(config.projectRoot, cayoPath)
          .then((pages) => {
            let pageModule = Object.entries(pages).find(([, { modulePath }]) => modulePath === filePath);
            let page = pageModule ? { [`${pageModule[0]}`]: pageModule[1] } : {}
            prerender(data.template, page, config)
          })
      } else {
        prerender(data.template, data.pages, config);
        // await import(`./dist/prerender.js`)
        //   .then(({ prerender }) => prerender(options, config.projectRoot));
        // refreshPrerender().then(({ prerender }) => prerender(options, config.projectRoot));
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
    }
  })
  await server.listen()
}

cli(process.argv);
