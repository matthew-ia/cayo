import * as compile from '../lib/core/compile/index.js';
import { loadConfig } from '../lib/core/config.js';
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

  const _cayo = {
    stats: {
      dependencies: { },
      compiled: new Set(),
      cayoComponents: { },
    }
  }

  // const stats = {
  //   dependencies: { },
  //   compiled: new Set(),
  // }

  const cayoConfig = await loadConfig(options);
  // 1. Compile Cayo Component (lib/components/Cayo.svelte)
  await compile.cayoComponent(cayoConfig);

  const { outputPath: templateOutputPath } = await compile.layout(cayoConfig);
  const Layout = (await import(templateOutputPath)).default;
  _cayo.layout = await Layout.render();
  
  // 2. Compile Compile Pages (src/pages/**/*.svelte)
  //    The result includes the compiled page information (name, code content, and dependencies)

  const pages = await compile.pages(null, _cayo, cayoConfig)

  let outputPath = path.resolve(
    cayoConfig.cayoPath, 
    `./__cayo/pages.json`
  );

  for (const p of pages) {
    p.render(false, _cayo.stats.cayoComponents);
  }
  // console.log('pages', pages);
  await fse.outputFile(outputPath, JSON.stringify(pages, null, 2));
  await fse.outputFile(path.resolve(cayoConfig.cayoPath, './__cayo/stats.json'), JSON.stringify(_cayo.stats, null, 2));

  // TODO: change this; stats should be a formally maintained object inside the main build process
  // For now, we manually mutate the result data to include the overall build stats 
  // which includes a flat dep tree and a list of all compiled components
  // NOTE: _cayo.stats.compiled is a Set, so we need to turn it into an array for iteration
  _cayo.stats.compiled = {
    paths: [..._cayo.stats.compiled]
  };
  for (let depender in _cayo.stats.dependencies) {
    _cayo.stats.dependencies[depender] = [..._cayo.stats.dependencies[depender]];
  }
  await fse.outputFile(path.resolve(cayoConfig.cayoPath, './__cayo/test.json'), JSON.stringify(_cayo.stats, null, 2));
}

run();