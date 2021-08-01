// import { existsSync, promises as fs } from 'fs';
import fs from 'fs-extra';
import path from 'path';

import { Renderer } from './renderer.js';
import { getPages } from './utils.js';

const config = {
  projectRoot: 'test'
}
const root = process.cwd();

export async function prerender() {
  const { Template } = await import('../.cayo/generated/template.js');

  const template = Template.render();
  const renderer = new Renderer(template.html);
  // console.log(renderer);

  const dotPath = path.join(process.cwd(), '.cayo/');

  // TODO: get component code
  const componentsToHydrate  = [];

  // TODO: get css from template and app, and concat in a new bundle

  const pages = await getPages('svelte');
  console.log(`Rendering ${Object.keys(pages).length} ${Object.keys(pages).length === 1 ? 'page' : 'pages'}...`);

  if (!fs.existsSync(dotPath)) {
    await fs.mkdir(dotPath)
  }

  Object.entries(pages).forEach(([pathname, page]) => {
    prerenderPage(renderer, dotPath, pathname, page);
  });
}

export async function prerenderPage(renderer, rootPath, pathname, page) {
  // console.log(page.filePath, page.meta);
  const { html, css } = renderer.render(pathname, page);

  const filePath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;

  await fs.outputFile(path.resolve(rootPath, `${filePath}`), html)
    .then(() => console.log('🖨   Prerendered', `${filePath}`));

  if (css.code !== '') {
    await fs.outputFile(path.resolve(rootPath, `${page.filePath}index.css`), css.code)
      .then(() => console.log('🎨  CSS output for', `${page.filePath}.html`));
  }
}