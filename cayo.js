import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import path from 'path';
import { createServer } from 'vite';
const __dirname = path.resolve();
import { prerender } from './src/prerender.js';
import { createLogger } from 'vite';
import chalk from 'chalk';

const logger = createLogger('info', {
  prefix: chalk.magenta('[cayo]'),
  allowClearScreen: false,
});

import { 
  hash, 
  viteBuildScript, 
  createPageImports, 
  createTemplateImport 
} from './dist/utils.js';

const config = {
  projectRoot: path.resolve(process.cwd(), 'test'),
  logger: logger,
  outDir: path.join(process.cwd(), '.cayo/'),
}

const options = {
  outDir: path.join(process.cwd(), '.cayo/'),
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
  logger.info(chalk.magenta('\n  cayo ') + chalk.green(`${cmd}`), { timestamp: false });

  const main = createTemplateImport(config.projectRoot, cayoPath)
    .then(() => createPageImports(config.projectRoot, cayoPath))
    // .then(() => refreshPrerender())
    .then(() => prerender(config))
    // .then(({ prerender }) => prerender(options, config.projectRoot))
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

async function refreshPrerender() {
  return viteBuildScript('prerender').then(async () => {
    return await import(`./dist/prerender.js?v=${hash()}`)
  });
}

async function refreshTemplate() {
  return createTemplateImport()
    .then(() => refreshPrerender())
}

async function refreshPages() {
  return createPageImports()
    .then(() => refreshPrerender());
}

function watch() {
  const watcher = chokidar.watch(`${config.projectRoot}/src`, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });
  watcher.on('change', async (path) => {
    if (path.endsWith('.svelte')) {
      if (path.endsWith('__index.svelte')) {
        refreshTemplate().then(({ prerender }) => prerender(config));
      } else {
        prerender(config, config.projectRoot);
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
