import { loadConfig } from './config.js';
import yargs from 'yargs-parser';
import { devServer } from './dev.js';
import { build } from './build.js';

// Load config

// Handle arguments
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

function run(command) {
  const { cmd, options } = command;
  try {
    const projectRoot = options.projectRoot;
    const config = await loadConfig(projectRoot, options.config);

    // TODO: actually run command now
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Run
export async function cli(args) {
  const argv = yargs(args);
  const command = resolveArgs(argv);
  // TODO: do something with options

  switch(command.cmd) {
    case 'dev':
      // run server
      devServer();
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
