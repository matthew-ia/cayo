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
  console.log(renderer);

  const dotPath = path.join(process.cwd(), '.cayo/');

  // TODO: get component code
  const componentsToHydrate  = [];

  // TODO: get css from template and app, and concat in a new bundle

  const pages = getPages('svelte');
  console.log('pages', pages);

  if (!fs.existsSync(dotPath)) {
    await fs.mkdir(dotPath)
  }


  let results = [];
  Object.entries(pages).forEach( async ([pathname, page]) => {
    const result = renderer.render(pathname, page);
    // const result = await prerenderPage(renderer, dotPath, pathname, page);
    await writePage(page, result, dotPath);
    results.push(result);
  });
}

export async function writePage(page, content = { html: '', css: '' }, distPath) {
  // console.log(page.filePath, page.meta);
  // const { html, css } = renderer.render(pathname, page);

  const filePath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  try {
    await fs.outputFile(path.resolve(distPath, `${filePath}`), content.html)
    .then(() => console.log('🖨   Prerendered', `${filePath}`));

    if (content.css.code !== '') {
      await fs.outputFile(path.resolve(distPath, `${page.filePath}index.css`), content.css.code)
        .then(() => console.log('🎨  CSS output for', `${page.filePath}.html`));
    }
  } catch(err) {
    console.error(err);
  }
}