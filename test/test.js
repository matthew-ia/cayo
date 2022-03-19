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
  const cayoConfig = await loadConfig(options);
  // 1. Compile Cayo Component (lib/components/Cayo.svelte)
  await compileCayoComponent(cayoConfig);
  // 2. Compile Compile Pages (src/pages/**/*.svelte)
  //    The result includes the compiled page information (name, code content, and dependencies)
  const result = await compilePages([path.resolve('./src/pages/index.svelte'), path.resolve('./src/pages/howdy.svelte')], null, cayoConfig)

  // TODO: change this; stats should be a formally maintained object inside the main build process
  // For now, we manually mutate the result data to include the overall build stats 
  // which includes a flat dep tree and a list of all compiled components
  result.stats.compiled = [...result.stats.compiled];
  for (let depender in result.stats.dependencies) {
    result.stats.dependencies[depender] = [...result.stats.dependencies[depender]];
  }
  await fse.outputFile(path.resolve(cayoConfig.cayoPath, './__cayo/test.json'), JSON.stringify(result, null, 2));
}

run();