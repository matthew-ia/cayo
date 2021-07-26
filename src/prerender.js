// require('svelte/register');
import { existsSync, promises as fs } from 'fs';
import fse from 'fs-extra';
import { join } from 'path';
import path from 'path';

import { Renderer } from './lib/renderer.js';
import { getPages } from './lib/utils.js';
import Template from '../src/__index.svelte';

const template = Template.render();
const renderer = new Renderer(template.html);

async function main() {
  // const templatePath = join(process.cwd(), 'src', 'index.template')
  const publicPath = join(process.cwd(), '.cayo/');
  const componentsToHydrate  = [];

  // const template = await fs.readFile(templatePath)
  // const app = App.render();
  // TODO: get css from template and app, and concat in a new bundle


  const pages = getPages('svelte');

  if (!existsSync(publicPath)) {
    await fs.mkdir(publicPath)
  }

  Object.entries(pages).forEach(([pathname, page]) => {
    // console.log(page.name, page.meta);
    const { html, css } = renderer.render(pathname, page);
    const filePath = `${page.name}.html`;
    fse.outputFileSync(path.resolve(publicPath, filePath), html);
    console.log('🖨   Prerendered', filePath);
    if (css.code !== '') {
      fse.outputFileSync(path.resolve(publicPath, `${page.name}.css`), css.code);
      console.log('🎨  CSS output for', `${page.name}.css`)
    }
    // await fs.writeFile(
    //   join(publicPath, 'index.html'),
    //   page.html
    //   // template.toString().replace('%cayo.head%', page.head).replace('%cayo.body%', page.html)
    // )
  });
  
}

main()