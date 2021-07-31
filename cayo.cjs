// import fse from 'fs-extra';
// import path from 'path';

const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const fse = require('fs-extra');
const rollup = require('rollup');

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs


const config = {
  projectRoot: 'test'
}
async function prep() {
  try {
    // await fse.copy(`${config.projectRoot}/src/__index.svelte`, './.cayo/prerender/__index.svelte');

    const resolvedProjectRoot = path.resolve(process.cwd(), config.projectRoot);
    const loadTemplate = `export async function loadTemplate() {
      return (await import('${resolvedProjectRoot}/src/__index.svelte')).default;
    }`;
    const loadPages = `export async function loadPages() {
      return import.meta.globEager('${resolvedProjectRoot}/src/pages/**/*.svelte');
    }`;
    await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/dynamicImports.js`, `${loadTemplate}\n${loadPages}`);
    // await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/template.js`, importPagesStr);

  } catch (err) {
    console.error(err)
  }

  // await import('./dist/prerender.js').then(({ prerender }) => prerender());
}

console.log(__dirname);

loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), { format: 'es' }).then(
  async ({ options, warnings }) => {
    // "warnings" wraps the default `onwarn` handler passed by the CLI.
    // This prints all warnings up to this point:
    console.log(`We currently have ${warnings.count} warnings`);

    // This prints all deferred warnings
    warnings.flush();

    // options is an array of "inputOptions" objects with an additional "output"
    // property that contains an array of "outputOptions".
    // The following will generate all outputs for all inputs, and write them to disk the same
    // way the CLI does it:
    for (const optionsObj of options) {
      await prep();
      console.log('am doing it');
      const bundle = await rollup.rollup(optionsObj);
      await Promise.all(optionsObj.output.map(bundle.write));
      await bundle.close();
    }

    // You can also pass this directly to "rollup.watch"
    // rollup.watch(options);
  }
).then(async () => {
  await import('./dist/prerender.js').then(({prerender}) => prerender());
  // console.log()
});

