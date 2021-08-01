// import fse from 'fs-extra';
// import path from 'path';

const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const fse = require('fs-extra');
const rollup = require('rollup');
const fg = require('fast-glob');
const crypto = require('crypto');
const { watch } = require('fs-extra');

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs

function hash() {
  return crypto.randomBytes(5).toString('hex');
}

const config = {
  projectRoot: 'test'
}

/*
const modules = {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js')
}
*/
async function prep() {
  try {
    // await fse.copy(`${config.projectRoot}/src/__index.svelte`, './.cayo/prerender/__index.svelte');

    const resolvedProjectRoot = path.resolve(process.cwd(), config.projectRoot);
    // let loadTemplate = `export async function loadTemplate() {`
    //   +`  return (await import('${resolvedProjectRoot}/src/__index.svelte')).default;`
    //   + `}`;

    let importTemplate = `export { default as Template } from '${resolvedProjectRoot}/src/__index.svelte';`;

    const pagePaths = await fg([`${resolvedProjectRoot}/src/pages/**/*.svelte`]);
    let importPages = '';
    pagePaths.forEach((path, i) => {
      importPages += `import * as page_${i} from '${path}'\n`;
    }); 
    importPages += 'export const pages = {\n';
    pagePaths.forEach((path, i) => {
      importPages += `  '${path}': page_${i},\n`;
    })
    importPages += '}\n';
      
    // klaw(``)
    //   .on('data', file => pagePaths.push(file.path))
    //   .on('end', () => {
    //     for (let i = 0; i < pagePaths.length; i++) {
    //       importPages += `import * as page_${i}`;
    //     }
    //   }
    // );
    
  
    await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/pages.js`, importPages);
    await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/template.js`, importTemplate);
    // await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/template.js`, importPagesStr);

  } catch (err) {
    console.error(err)
  }

  // await import('./dist/prerender.js').then(({ prerender }) => prerender());
}

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

    // const { prerender } = await import('./dist/prerender.js');
    // prerender();

    // You can also pass this directly to "rollup.watch"
    const watcher = rollup.watch(options);
    watcher.on('event', async (event) => {
      console.log(event.code);
      if (event.code === 'END') {
        await import(`./dist/prerender.js?v=${hash()}}`).then(({ prerender }) => prerender() );
      }
    })
    watcher.on('event', ({ result }) => {
      if (result) {
        result.close();
      }
    });

    watcher.close();
  }
);
// ).then(async () => {
  
//   // await import('./dist/prerender.js').then(() => console.log('done'));
//   // console.log()
// });

