
// Run createPageImports (initial)
// Run createTemplateImport (initial)

import { hash, viteBuildScript } from './dist/utils.js';
import yargs from 'yargs-parser';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import path from 'path';
import { createPageImports, createTemplateImport } from './src/utils.js';
import { dev } from './src/dev.js';

const config = {
  projectRoot: 'test'
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
      // run server
      console.log('hey');
      runDev();
      break;
    case 'build':
      // run build
      build();
      break;
    case 'help':
    default:
      printHelp();
  }
}

async function runDev() {
// > watch src/**/*.svelte 
//   > if === template
//     > createTemplateImport => rebuild 'dev' => run 'dev' on changed page
//   > else if === a new page
//     > createPageImports => rebuild 'dev' => run 'dev' on changed page
//   > else 
//     > rebuild 'dev' => run 'dev' on changed page

  createTemplateImport(resolvedProjectRoot, dotPath);
  createPageImports(resolvedProjectRoot, dotPath);
  await viteBuildScript('dev')
    .then(async () => {
      return await import(`./dist/dev.js?v=${hash()}}`)
    }).then(({ dev }) => dev());

  const watcher = chokidar.watch(`${resolvedProjectRoot}/src`);

  watcher.on('change', async (path) => {
    console.log('> watch:change', path);
    if (path.endsWith('.svelte')) {
      if (path.endsWith('__index.svelte')) {
        createTemplateImport()
          .then(async () => {
            return await viteBuildScript('dev')
          }).then(async () => {
            return await import(`./dist/dev.js?v=${hash()}}`)
          }).then(({ dev }) => dev(path));
      } else {
        await viteBuildScript('dev')
          .then(async () => {
            return await import(`./dist/dev.js?v=${hash()}}`)
          }).then(({ dev }) => dev(path));
      }
    }
  });

}

function runBuild() {
// > Run build 'build' script
// > Run 'build' script 
// > Done
}

cli(process.argv);
