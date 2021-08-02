import { Renderer } from './renderer.js';
import { getPages, createPageImports, createTemplateImport } from './utils.js';
import { prerender } from './dist/prerender';

export default async function build() {
  return await createTemplateImport().then(createPageImports).then(async () => {
    const dotPath = path.join(process.cwd(), '.cayo/');

    const { Template } = await import('../.cayo/generated/template.js');
    const template = Template.render();
    const { render } = new Renderer(template.html);

    const pages = getPages();
    
    console.log(`Rendering ${Object.keys(pages).length} ${Object.keys(pages).length === 1 ? 'page' : 'pages'}...`);
    Object.entries(pages).forEach(([pathname, page]) => {
      await prerender(render, pathname, page, dotPath);
    });  
  });
}
