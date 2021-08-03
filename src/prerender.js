
import { getPages } from './utils.js';
import { handlePageDeps } from './deps.js';
import { Renderer } from './renderer.js';
import fs from 'fs-extra';
import path from 'path';

const development = import.meta.env.DEV;

export async function prerender(options) {
  const { Template } = await import(`../.cayo/generated/template.js`);
  const template = Template.render();
  const renderer = new Renderer(template.html);
  const pages = await import(`../.cayo/generated/pages.js`)
    .then(({ pages }) => getPages(pages));

  console.log(`Rendering ${Object.keys(pages).length} ${Object.keys(pages).length === 1 ? 'page' : 'pages'}...`);
  Object.entries(pages).forEach(([pathname, page]) => {
    const { html } = prerenderPage(renderer, pathname, page, options.outDir);
    handlePageDeps(html);
  });
}

export async function prerenderPage(renderer, pathname, page, rootPath) {
  const filePath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  const { html, css } = renderer.render(pathname, page);

  await fs.outputFile(path.resolve(rootPath, `${filePath}`), html)
    .then(() => console.log('🖨   Prerendered', `${filePath}`));

  if (css.code !== '') {
    await fs.outputFile(path.resolve(rootPath, `${page.filePath}index.css`), css.code)
      .then(() => console.log('🎨  CSS output for', `${page.filePath}.html`));
  }

  return { html, css };
}


