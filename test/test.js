import * as compile from '../lib/compile/index.js';
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

  const stats = {
    dependencies: { },
    compiled: new Set(),
  }

  const cayoConfig = await loadConfig(options);
  // 1. Compile Cayo Component (lib/components/Cayo.svelte)
  await compile.cayoComponent(cayoConfig);
  // const { outputPath: templateOutputPath } = await compile.layout(cayoConfig);
  // const TemplateComponent = (await import(templateOutputPath)).default;
  // const template = TemplateComponent.render();
  
  // 2. Compile Compile Pages (src/pages/**/*.svelte)
  //    The result includes the compiled page information (name, code content, and dependencies)

  await compile.pages([path.resolve('./src/pages/index.svelte'), path.resolve('./src/pages/howdy.svelte')], stats, cayoConfig)

  // TODO: change this; stats should be a formally maintained object inside the main build process
  // For now, we manually mutate the result data to include the overall build stats 
  // which includes a flat dep tree and a list of all compiled components
  // NOTE: stats.compiled is a Set, so we need to turn it into an array for iteration
  stats.compiled = {
    paths: [...stats.compiled]
  };
  for (let depender in stats.dependencies) {
    stats.dependencies[depender] = [...stats.dependencies[depender]];
  }
  await fse.outputFile(path.resolve(cayoConfig.cayoPath, './__cayo/test.json'), JSON.stringify(stats, null, 2));
}

run();