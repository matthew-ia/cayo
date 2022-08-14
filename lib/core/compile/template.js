import path from 'path';
import fs from 'fs-extra';
import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'

import { build } from '../bundle.js';
import { Component } from '../component.js';

export async function compileTemplate(_cayo) {
  const { template: templatePath, templateName } = _cayo.config;
  let filename = `${templateName}.svelte`;
  try {
    const { code, dependencies } = await build(templatePath, _cayo.config, 'template');
    // const source = await fs.readFile(templatePath, 'utf8');
    // TODO: support user-defined preprocessors for layout too?
    // TODO: change this to use bundle.js
    // const template = await preprocess(source, sveltePreprocess(), { filename });
    // const {
    //   js,
    //   warnings,
    //   // stats 
    // } = compile(template.code, {
    //   generate: 'ssr', 
    //   dev: true, // probably want this
    //   hydratable: true, // this is default, may need to be changed just fo Cayo components
    //   preserveComments: true, // optional, may be useful for dev
    //   preserveWhitespace: true, // optional, may be useful for dev  
    // });

    // // TODO: some helpful stuff with warnings and stats
    // if (warnings.length !== 0) {
    //   console.log(filename, 'has warnings...\n', warnings);
    // }
    
    // TODO: consider how to handle CSS from template


    
    let outputPath = path.resolve(_cayo.config.cayoPath, `./__cayo/template.js`);
    await fs.outputFile(outputPath, code);

    const Template = new Component('template', code, templatePath, outputPath, dependencies, _cayo.config);
    _cayo.template = await Template.render(_cayo, { load: true });

    return Template;

  } catch (err) {
    throw new Error(`Compiling template: ${filename}\n` + err);
  }
}