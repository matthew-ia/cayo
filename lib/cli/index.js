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

import { loadConfig, checkConfigPaths } from '../core/config.js';
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
    
    await compile.pages(null, _cayo, cayoConfig);

    // A side effect of compiling all pages is having a full depedency tree
    // so we can up
    for (const [key, page] of _cayo.pages) {
      page.writeModule();
      page.dependencies = _cayo.stats.dependencies.pages[key];  
    }

    // let temp = _cayo.pages.find(page => page.name === 'index');
    // console.log(temp.name, temp.dependencies);
    
    // for debugging
    debugStats(_cayo.stats, cayoConfig);

    // Run the command
    commands.get(cmd)(cayoConfig, _cayo);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function debugStats(stats, cayoConfig) {
  // console.log('\n\n\nstats', stats, '\n\n\n');
  // for (let page in debug.dependencies.pages) {
  //   debug.dependencies.pages[page] = [...debug.dependencies.pages[page]];
  // }
  // for (let component in debug.dependencies.components) {
  //   debug.dependencies.components[component] = [...debug.dependencies.components[component]];
  // }
  // debug.compiled.paths = [...debug.compiled.paths];
  fse.outputFile(path.resolve(cayoConfig.cayoPath, './__cayo/stats.json'), JSON.stringify(
    stats, 
    (key, value) => value instanceof Set ? [...value] : value,
    2
  ));

}


// const { outputPath: layoutOutputPath } = await compile.template(cayoConfig);
// // Compile user layout
// const Layout = (await import(layoutOutputPath)).default;
// const layout = Layout.render();