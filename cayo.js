// import fse from 'fs-extra';
// import path from 'path';

import loadConfigFile from 'rollup/dist/loadConfigFile.js';
import path from 'path';
const __dirname = path.resolve();
import fse from 'fs-extra';
import * as rollup from 'rollup';
import fg from 'fast-glob';
import crypto from 'crypto';

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs

function hash() {
  return crypto.randomBytes(5).toString('hex');
}

const config = {
  projectRoot: 'test'
}

const resolvedProjectRoot = path.resolve(process.cwd(), config.projectRoot);
/*
const modules = {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js')
}
*/

async function createPageImports() {
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
  return await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/pages.js`, importPages);
}

async function createTemplateImport() {
  let importTemplate = `export { default as Template } from '${resolvedProjectRoot}/src/__index.svelte';`;
  await fse.outputFile(`${path.resolve(process.cwd(), '.cayo')}/generated/template.js`, importTemplate);
}

// async function prep() {
//   try {


//   } catch (err) {
//     console.error(err)
//   }

//   // await import('./dist/prerender.js').then(({ prerender }) => prerender());
// }


// ).then(async () => {
  
//   // await import('./dist/prerender.js').then(() => console.log('done'));
//   // console.log()
// });

// async function build() {
//   return await loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), { format: 'es' }).then(rollupBuild);
// }
function build() {
  loadConfigFile(path.resolve(__dirname, 'rollup.config.js'), { format: 'es' }).then(rollupBuild);
}

async function rollupBuild({ options, warnings }) {
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
    console.log('bundling...');
    const bundle = await rollup.rollup(optionsObj);
    await Promise.all(optionsObj.output.map(bundle.write));
    // await bundle.close();
  }

  const watcher = rollup.watch(options);

  watcher.on('event', async (event) => {
    // console.log(event.code);
    if (event.code === 'END') {
      await import(`./dist/prerender.js?v=${hash()}}`).then(({ prerender }) => prerender() );
    }
  })
  watcher.on('change', (path) => {
    // if (path.endsWith('.svelte')) {
    //   if (path.endsWith('__index.svelte')) {
    //     createTemplateImport();
    //   } else {
    //     createPageImports();
    //   }
    // }
    console.log('> watch:change', path);
  })

  watcher.on('event', ({ result }) => {
    if (result) {
      console.log('closing bundle');
      result.close();
    }
  });
  watcher.close();

  // const { prerender } = await import('./dist/prerender.js');
  // prerender();

  // You can also pass this directly to "rollup.watch"
}

import chokidar from 'chokidar';

// One-liner for current directory
const watcher = chokidar.watch(`${resolvedProjectRoot}/src`);
// watcher.on('all', (event, path) => {
//   console.log('watch:', event, path);
// });

watcher.on('add', async (path) => {
  console.log('watch:add', path);
  // TODO: maybe improve this by programmatically spawning this entire script
  // and watch for these files in an external chokidar instance
  if (path.endsWith('.svelte')) {
    if (path.endsWith('__index.svelte')) {
      createTemplateImport();
    } else {
      createPageImports();
    }
  }
  
  // await build().then(async ()=>{
  //   await import(`./dist/prerender.js?v=${hash()}}`).then(({ prerender }) => prerender() );
  // });
})

createPageImports();
createTemplateImport();
build();