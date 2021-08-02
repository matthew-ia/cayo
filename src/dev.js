
import { getPages } from './utils.js';
import { Renderer } from './renderer.js';
import { prerender } from './prerender.js';
import path from 'path';

export async function dev(modulePath) {

  const dotPath = path.join(process.cwd(), '.cayo/');
  const { Template } = await import('../.cayo/generated/template.js');
  const template = Template.render();
  const renderer = new Renderer(template.html);
  const pages = await getPages();

  if (modulePath) {
    const ext = 'svelte';
    const extRegex = new RegExp(String.raw`(\.${ext})$`);
    const filePath = modulePath.replace(/^(.+)\/pages\//, '').replace(extRegex, '')
    const urlPath = filePath === 'index' ? filePath.replace(/index$/, '/') : `${filePath}/`
    prerender(renderer, urlPath, pages[urlPath], dotPath);
  } else {
    console.log(`Rendering ${Object.keys(pages).length} ${Object.keys(pages).length === 1 ? 'page' : 'pages'}...`);
    Object.entries(pages).forEach(([pathname, page]) => {
      prerender(renderer, pathname, page, dotPath);
    });
  }
}


