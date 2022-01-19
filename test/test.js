import { compilePages } from "../lib/pages.js";
import { loadConfig } from '../lib/config.js';
import yargs from 'yargs-parser';
import path from 'path';

async function run() {
  const argv = yargs(process.argv);
  const options = {
    projectRoot: typeof argv.projectRoot === 'string' ? argv.projectRoot : undefined,
    configPath: typeof argv.config === 'string' ? argv.config : undefined,
    // mode: cmd === 'build' ? 'production' : 'development',
  }
  const config = await loadConfig(options);
  compilePages([path.resolve('./src/pages/index.svelte')], config).then((res) => console.log(res));
  // checkConfigPaths(config, errorLogger);
}

run();