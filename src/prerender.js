// import { existsSync, promises as fs } from 'fs';
import fs from 'fs-extra';
import path from 'path';

function generateComponentHyrdator() {

}

export async function prerender(renderer, pathname, page, rootPath) {
 
  const { html, css } = renderer.render(pathname, page);

  const filePath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;

  await fs.outputFile(path.resolve(rootPath, `${filePath}`), html)
    .then(() => console.log('🖨   Prerendered', `${filePath}`));

  if (css.code !== '') {
    await fs.outputFile(path.resolve(rootPath, `${page.filePath}index.css`), css.code)
      .then(() => console.log('🎨  CSS output for', `${page.filePath}.html`));
  }

  return { html, css };
}
