import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { promises as fs } from 'fs';
import { default as fse } from 'fs-extra';
import path from 'path';

export async function compileTemplate(config) {
  const { src, templateName } = config;
  let filename = `${templateName}.svelte`;
  let templatePath = path.resolve(src, `${templateName}.svelte`);
  try {
    const source = await fs.readFile(templatePath, 'utf8');
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
    if (warnings) {
      console.log(filename, 'has warnings...')
    }
    
    // TODO: consider how to handle CSS from template

    let outputPath = path.resolve(config.cayoPath, `./__cayo/template.js`);

    await fse.outputFile(outputPath, js.code);
    const TemplateComponent = (await import(outputPath)).default;
    return TemplateComponent.render();

  } catch (err) {
    console.error(`Error compiling template: ${filename}\n`, err);
  }
}