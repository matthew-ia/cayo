import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { default as fse } from 'fs-extra';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// TODO: this needs to be turned into a script, bc we still need to compile the Cayo.svelte component at times
// the current dist/index.js is actually a copy of an output from this func when it was used in the cli,
// using lib/components/Cayo.svelte as the source

export async function compileCayoComponent(config) {
  const source = await fs.readFile(path.resolve(__dirname, '../../components/cayo.svelte'), 'utf8');
  let filename = 'cayo.svelte';
  const component = await preprocess(source, sveltePreprocess(), { filename });
  const {
    js,
    warnings,
  } = compile(component.code, {
    generate: 'ssr', 
    dev: false, // probably want this
    hydratable: true, // this is default, may need to be changed just fo Cayo components
    preserveComments: true, // optional, may be useful for dev
    preserveWhitespace: true, // optional, may be useful for dev  
  });

  // TODO: some helpful stuff with warnings and stats
  if (warnings.length !== 0) {
    console.log(filename, 'has warnings...\n', warnings);
  }

  try {
    // Write the JS version of the component to a new file
    let outputPath = path.resolve(config.cayoPath, `./__cayo/${filename.replace('.svelte', '.svelte.js')}`);
    await fse.outputFile(outputPath, js.code);


  } catch (err) {
    console.error(`Error compiling component: ${filename}\n`, err);
  }
}