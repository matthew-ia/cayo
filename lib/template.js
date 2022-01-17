import { compile, preprocess } from 'svelte/compile';
import fg from 'fast-glob';
import path from 'path';

export async function compileTemplate(config) {
  const { src, templateName } = config;
  let filename = `${templateName}.svelte`;
  let templatePath = path.resolve(src, `${templateName}.svelte`);
  let templateModulePath = await fg([templatePath]);

  if (templateModulePath) {
    return await preprocess(source, sveltePreprocess(), { filename }).then(template => {     
      const {
        js: TemplateComponent,
        warnings,
        // stats 
      } = compile(page, {
        generate: 'ssr', 
        dev: true, // probably want this
        hydratable: false, // this is default, may need to be changed just fo Cayo components
        preserveComments: true, // optional, may be useful for dev
        preserveWhitespace: true, // optional, may be useful for dev  
      });
  
      // TODO: some helpful stuff with warnings and stats
      if (warnings) {
        console.log(filename, 'as warnings...')
      }
      
      // TODO: consider how to handle CSS from template
      // first arg is the "page" object; page object would have some other stuff too, but for sake of brevity,
      // we're just passing the JS class we got from svelte.compile
      return { html, css } = TemplateComponent.render();
    });
  }
}