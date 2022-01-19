import { compile, preprocess } from 'svelte/compiler';
import sveltePreprocess from 'svelte-preprocess'
import { promises as fs } from 'fs';
import { default as fse } from 'fs-extra';
import fg from 'fast-glob';
import path from 'path';

export async function compileTemplate(config) {
  const { src, templateName } = config;
  let filename = `${templateName}.svelte`;
  let templatePath = path.resolve(src, `${templateName}.svelte`);
  // check if it exists with a fs extras or something
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

    // console.log('template', js);

    // let TemplateComponent;
    let tp = path.resolve(config.cayoPath, `./components/template.js`);
    return fse.outputFile(tp, js.code).then(async () => {
      const TemplateComponent = (await import(tp)).default;
      return TemplateComponent.render();
    }).catch(err => console.error(err));
    
    // TODO: consider how to handle CSS from template
    // first arg is the "page" object; page object would have some other stuff too, but for sake of brevity,
    // we're just passing the JS class we got from svelte.compile
  } catch (err) {
    console.log(err);
  }
}