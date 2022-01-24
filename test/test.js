import { compilePages } from "../lib/pages.js";
import { loadConfig } from '../lib/config.js';
import { default as fse } from 'fs-extra';
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
  const result = await compilePages([path.resolve('./src/pages/index.svelte')], null, config)
  console.log('TEST: ', result)
  result.stats.compiled = [...result.stats.compiled];
  await fse.outputFile(path.resolve(config.cayoPath, './__cayo/test.json'), JSON.stringify(result, null, 2));
  
  // checkConfigPaths(config, errorLogger);
}

run();