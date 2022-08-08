import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { promises as fs } from 'fs';
import { default as fse } from 'fs-extra';
import path from 'path';

import { Component } from '../component.js';

export async function compileLayout(config) {
  const { src, templateName } = config;
  let filename = `${templateName}.svelte`;
  let sourcePath = path.resolve(src, `${templateName}.svelte`);
  try {
    const source = await fs.readFile(sourcePath, 'utf8');
    const template = await preprocess(source, sveltePreprocess(), { filename });
    const {
      js,
      warnings,
      // stats 
    } = compile(template.code, {
      generate: 'ssr', 
      dev: true, // probably want this
      hydratable: true, // this is default, may need to be changed just fo Cayo components
      preserveComments: true, // optional, may be useful for dev
      preserveWhitespace: true, // optional, may be useful for dev  
    });

    // TODO: some helpful stuff with warnings and stats
    if (warnings.length !== 0) {
      console.log(filename, 'has warnings...\n', warnings);
    }
    
    // TODO: consider how to handle CSS from template

    let outputPath = path.resolve(config.cayoPath, `./__cayo/template.js`);

    await fse.outputFile(outputPath, js.code);

    return new Component('layout', js.code, sourcePath, outputPath, null, config);

  } catch (err) {
    console.error(`Error compiling layout: ${filename}\n`, err);
  }
}