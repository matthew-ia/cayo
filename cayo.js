import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import path from 'path';
import { createServer } from 'vite';
const __dirname = path.resolve();
import { prerender } from './src/prerender.js';

import { 
  hash, 
  viteBuildScript, 
  getPageModulePaths,
  createPageImports, 
  createTemplateImport 
} from './dist/utils.js';

const config = {
  projectRoot: 'test'
}

const options = {
  outDir: path.join(process.cwd(), '.cayo/'),
}

const resolvedProjectRoot = path.resolve(process.cwd(), config.projectRoot);
const dotPath = path.join(process.cwd(), '.cayo/');

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
  const main = createTemplateImport(resolvedProjectRoot, dotPath)
    .then(() => createPageImports(resolvedProjectRoot, dotPath))
    // .then(() => refreshPrerender())
    .then(() => prerender(options, resolvedProjectRoot))
    // .then(({ prerender }) => prerender(options, resolvedProjectRoot))
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
  const watcher = chokidar.watch(`${resolvedProjectRoot}/src`, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });
  watcher.on('change', async (path) => {
    console.log('> watch:change', path); 
    if (path.endsWith('.svelte')) {
      if (path.endsWith('__index.svelte')) {
        console.log('> watch:change : refreshing template & rerendering'); 
        refreshTemplate().then(({ prerender }) => prerender(options, resolvedProjectRoot));
      } else {
        console.log('> watch:change : rerendering'); 
        prerender(options, resolvedProjectRoot);
        // await import(`./dist/prerender.js`)
        //   .then(({ prerender }) => prerender(options, resolvedProjectRoot));
        // refreshPrerender().then(({ prerender }) => prerender(options, resolvedProjectRoot));
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
