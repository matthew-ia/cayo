import yargs from 'yargs-parser';
import chokidar from 'chokidar';
import chalk from 'chalk';


import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from '../files.js';

import { 
  hash,
} from '../utils.js';

import { loadConfig, checkConfigPaths } from '../config.js';
import * as compile from '../compile/index.js';
import { logger } from '../logger.js';

import { dev } from './dev.js';
import { build } from './build.js';

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
      return { cmd: 'unknown', options };
  }
}

// Run
export async function cli(args) {
  const argv = yargs(args);
  const command = resolveArgs(argv);
  run(command);
}

const commands = new Map([
  ['build', async (config, _cayo) => {
    build(config, _cayo);
    // await prerenderPages(config).then((pages)=> {
    //   build(config, pages);
    // });
  }],
  ['dev', (config, _cayo) => {
    dev(config, _cayo);
    // prerenderPages(config);
    // watch(config);
    // serve(config);
  }], 
  ['help', (config, _cayo) => {
    help(logger);
  }], 
  ['unknown', (config, _cayo) => {
    help(config, logger, true);
  }], 
]);

function help(config, logger, isUnknownCommand)  {
  // TODO: help info
  if (isUnknownCommand) console.log(`unknown command. here's some help:`)
  console.log('help');
}

async function run(command) {
  const { cmd, options } = command;
  logger.log.info(
    `\n  ${chalk.magenta.bold(`cayo.${cmd}`)}${chalk.dim(` starting`)}`, 
    { timestamp: false }
  );

  try {
    // Initialzie Cayo CLI runtime data
    const _cayo = {
      layout: null,
      pages: null, 
      components: null,
      stats: {
        dependencies: { },
        compiled: new Set(),
        cayoComponents: { },
      },
    }

    // Initialzie Cayo Config
    const cayoConfig = await loadConfig(options);
    checkConfigPaths(cayoConfig, logger.error);

    // Create a fresh cayo folder for this run
    cleanCayoPath(cayoConfig.cayoPath);

    // Compile internal cayo component
    await compile.cayoComponent(cayoConfig);
    // Compile layout template that will be used by pages
    const Layout = await compile.layout(cayoConfig);
    _cayo.layout = await Layout.render(true);
    
    // Compile all user page and their dependent component files
    _cayo.pages = await compile.pages(null, _cayo, cayoConfig);

    // Run the command
    commands.get(cmd)(cayoConfig, _cayo);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}


// const { outputPath: layoutOutputPath } = await compile.template(cayoConfig);
// // Compile user layout
// const Layout = (await import(layoutOutputPath)).default;
// const layout = Layout.render();