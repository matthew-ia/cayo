// require('svelte/register');
import { existsSync, promises as fs } from 'fs';
import fse from 'fs-extra';
import { join } from 'path';
import path from 'path';

import { Renderer } from './renderer.js';
import { getPages } from './utils.js';
// const getPages = () => {}
// Dynamic import

const config = {
  projectRoot: 'test'
}

import loadTemplate from '../.cayo/prerender/template.js';



const root = process.cwd();

async function main() {
  const Template = await loadTemplate();
  // import Template from '../.cayo/prerender/template.js';

  // const Template = (await import('../test/src/__index.svelte')).default;
  console.log(Template);
  
  // import Template from '../test/__index.svelte';

  const template = Template.render();
  const renderer = new Renderer(template.html);
  console.log(renderer);


  // const templatePath = join(process.cwd(), 'src', 'index.template')
  const publicPath = join(process.cwd(), '.cayo/');
  const componentsToHydrate  = [];

  // const template = await fs.readFile(templatePath)
  // const app = App.render();
  // TODO: get css from template and app, and concat in a new bundle


  const pages = await getPages('svelte', path.resolve(root, config.projectRoot));
  console.log('pages', pages);

  if (!existsSync(publicPath)) {
    await fs.mkdir(publicPath)
  }

  Object.entries(pages).forEach(([pathname, page]) => {
    console.log(page.name, page.meta);
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

// fse.copy(`${config.projectRoot}/src/__index.svelte`, './.cayo/prerender/__index.svelte', err => {
//   if (err) return console.log(err);
//   console.log('rip');

//   // const files = [] // files, directories, symlinks, etc
//   // klaw(`${config.projectRoot}/src/pages`)
//   //   .on('data', file => files.push(item.path))
//   //   .on('end', () => console.dir(files)) // => [ ... array of files]
//   // for await (const file of klaw(`${config.projectRoot}/src/pages`)) {
//   //   console.log(file)
//   // }
//   // main()
// });


// TODO: this prob needs to be put into a separate script and run entirely before prerender bc of import dependencies
// async function prep() {
//   try {
//     await fse.copy(`${config.projectRoot}/src/__index.svelte`, './.cayo/prerender/__index.svelte');
//     let temp = await fse.readFile('./src/templates/importMetaGlobEager.template', 'utf8');
//     temp = temp.replace('%PATH%', `../../${config.projectRoot}/src/pages/**/*.svelte`);
//     await fse.outputFile('./.cayo/prerender/getPagesUtility.js', temp);
//     main();
//   } catch (err) {
//     console.error(err)
//   }
// }
main();

// prep();
// main();