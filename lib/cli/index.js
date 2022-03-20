import yargs from 'yargs-parser';
import chokidar from 'chokidar';


import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from './files.js';

import { 
  hash,
  getPageModules, 
  getComponentModules,
  createTemplateManifest,
  createPageManifest,
  createComponentManifest,
} from './utils.js';

import { logger } from './logger.js';

import { loadConfig, checkConfigPaths } from './config.js';

const CAYO = {
  layout: null,
  pages: null, 
  components: null,
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
  ['build', async (config) => {
    await prerenderPages(config).then((pages)=> {
      build(config, pages);
    });
  }],
  ['dev', (config) => {
    prerenderPages(config);
    watch(config);
    serve(config);
  }], 
  ['help', (config) => {
    help();
  }], 
  ['unknown', (config) => {
    help(true);
  }], 
]);

function help(isUnknownCommand)  {
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
    const config = await loadConfig(options);
    checkConfigPaths(config, errorLogger);

    // Create a fresh cayo folder for this run
    cleanCayoPath(config.cayoPath);

    // Compile internal cayo component
    await compile.cayoComponent(cayoConfig);
    await compile.template(cayoConfig);
    // const { outputPath: layoutOutputPath } = await compile.template(cayoConfig);
    // // Compile user layout
    // const Layout = (await import(layoutOutputPath)).default;
    // const layout = Layout.render();
    
    // Compile user page and component files
    await compile.pages([path.resolve('./src/pages/index.svelte'), path.resolve('./src/pages/howdy.svelte')], stats, cayoConfig)



    // getTemplate(config)
    //   .then(() => getPages(config))
    //   .then(() => getCayoComponents(config))
    //   .then((components) => {
    //     handleCayoComponents(components, config);
    //   })
    //   .then(() => {
    //     const runCommand = commands.get(cmd);
    //     runCommand(config);   
    //   });

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}