import { compilePages } from "../lib/pages.js";
import { compileCayoComponent } from "../lib/components.js";
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
  await compileCayoComponent(config);
  const result = await compilePages([path.resolve('./src/pages/index.svelte'), path.resolve('./src/pages/howdy.svelte')], null, config)
  // console.log('TEST: ', result)
  result.stats.compiled = [...result.stats.compiled];
  for (let depender in result.stats.dependencies) {
    result.stats.dependencies[depender] = [...result.stats.dependencies[depender]];
  }
  await fse.outputFile(path.resolve(config.cayoPath, './__cayo/test.json'), JSON.stringify(result, null, 2));
}

run();