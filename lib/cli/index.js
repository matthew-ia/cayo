import yargs from 'yargs-parser';
import fs from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { 
  writePageFiles,
  cleanCayoPath,
} from '#core/files.js';

import { loadConfig } from '#core/config.js';
import * as compile from '#core/compile/index.js';
import logger from '#core/logger.js';
import { debugStats } from '#core/utils.js';

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
  ['build', async (_cayo) => {
    build(_cayo);
    // await prerenderPages(config).then((pages)=> {
    //   build(config, pages);
    // });
  }],
  ['dev', (_cayo) => {
    dev(_cayo);
    // prerenderPages(config);
    // watch(config);
    // serve(config);
  }], 
  ['help', (_cayo) => {
    help(_cayo, logger);
  }], 
  ['unknown', (_cayo) => {
    help(_cayo, logger, true);
  }], 
]);

function help(_cayo, logger, isUnknownCommand)  {
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

  // Initialzie Cayo Config
  let cayoConfig;
  try {
    cayoConfig = await loadConfig(options);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }

  try {
    const __VERSION__ = (await fs.readJSON(path.resolve(__dirname, '../../package.json'))).version;
    // Initialzie Cayo CLI runtime data
    const _cayo = {
      template: null,
      pages: new Map(), 
      components: new Map(),
      stats: {
        dependencies: { 
          pages: {},
          components: {},
          entries: {},
          assets: {},
        },
        cayoComponents: { },
        compiled: {
          paths: new Set(),
        },
      },
      config: cayoConfig,
      logger,
      __VERSION__,
    }

    // Create a fresh cayo folder for this run
    cleanCayoPath(_cayo.config.cayoPath);
    
    // Compile & Render all user page and their dependent component files
    try {
      // Compile template that will be used by all pages
      await compile.template(_cayo);

      await compile.pages(null, _cayo);
      for (const [key, page] of _cayo.pages) {
        page.dependencies = _cayo.stats.dependencies.pages[key];  
        await page.render(_cayo, { load: true });
      }

      for (const [, page] of _cayo.pages) {
        await writePageFiles(page, _cayo);
      } 

    } catch (err) {
      if (_cayo.config.debug) {
        // console.error ()
      }
      
      logger.error(err);
      if (cmd === 'build') {
        process.exit(1);
      }
    }

    // for debugging
    if (_cayo.config.debug) {
      debugStats(_cayo);
    }
    
    // Run the command
    commands.get(cmd)(_cayo);

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}
