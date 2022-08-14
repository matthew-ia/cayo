import yargs from 'yargs-parser';
import chalk from 'chalk';
import { default as fse } from 'fs-extra';
import path from 'path';

import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from '../core/files.js';

import { 
  hash,
} from '../core/utils.js';

import { loadConfig } from '../core/config.js';
import * as compile from '../core/compile/index.js';
import { logger } from '../core/logger.js';

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
    // Initialzie Cayo CLI runtime data
    const _cayo = {
      template: null,
      pages: new Map(), 
      components: new Map(),
      stats: {
        dependencies: { 
          pages: { },
          components: { },
        },
        cayoComponents: { },
        compiled: {
          paths: new Set(),
        },
      },
      config: cayoConfig,
      logger,
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
        writePageFiles(page, _cayo);
      }

      // TODO: decide: Need to pass null, or just remove that arg?
      await compile.cayos(null, _cayo);

    } catch (err) {
      logger.error(err);
    }

    // for debugging
    if (_cayo.config.debug) {
      debugStats(_cayo);
    }
    
    // Run the command
    commands.get(cmd)(_cayo);

  } catch (err) {
    logger.error(err, { timestamp: true, clear: false, });
    console.trace(err);
    process.exit(1);
  }
}

async function debugStats(_cayo) {
  const { stats, config } = _cayo;
  // console.log('\n\n\nstats', stats, '\n\n\n');
  // for (let page in debug.dependencies.pages) {
  //   debug.dependencies.pages[page] = [...debug.dependencies.pages[page]];
  // }
  // for (let component in debug.dependencies.components) {
  //   debug.dependencies.components[component] = [...debug.dependencies.components[component]];
  // }
  // debug.compiled.paths = [...debug.compiled.paths];
  fse.outputFile(path.resolve(config.cayoPath, './__cayo/stats.json'), JSON.stringify(
    stats, 
    (key, value) => value instanceof Set ? [...value] : value,
    2
  ));

}
