
import { getPages } from './utils.js';
import { handlePageDeps } from './deps.js';
import { Renderer } from './renderer.js';
import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';

const development = import.meta.env.DEV;

export async function prerender(options) {
  const { Template } = await import(`../.cayo/generated/template.js`);
  const template = Template.render();
  const renderer = new Renderer(template.html);
  let pages = await import(`../.cayo/generated/pages.js`)
    .then(({ pages }) => getPages(pages));

  console.log(`Rendering ${Object.keys(pages).length} ${Object.keys(pages).length === 1 ? 'page' : 'pages'}...`);

  // Get all the rendered content
  // const renderedContent = {};
  const deps = {};
  const componentList = new Set();

  // Render page, parse html, and save its deps
  Object.entries(pages).forEach(async ([pathname, page]) => {

    // Render page
    const content = renderer.render(pathname, page);
    // Postprocess the content, get deps and inject dep references
    const { html, css, js, components } = handlePageDeps(content, page.modulePath);

    for (let component of components) {
      componentList.add(component);
    }

    await writeContent({ html , css, js }, page, options.outDir);
  });

  // Do something with componentList
}

async function writeContent(content, page, outDir) {
  const { html, css } = content;
  
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => console.log('🖨   Prerendered', `${htmlPath}`));

  if (css.code !== '') {
    await fs.outputFile(path.resolve(outDir, `${page.filePath}index.css`), css.code)
      .then(() => console.log('🎨  CSS output for', `${page.filePath}.html`));
  }
}





/*

import MyComponent from './MyComponent.svelte';

window.MyComponent = function (options) {
    return new MyComponent(options);
};

document.addEventListener("DOMContentLoaded", function (event) {
  new MyComponent({
      target: document.getElementById("my-component"),
      hydrate: true,
      props: { ... },
  });
});


*/


// Derive JS dependencies from the html
export function handlePageDeps(content, path) {
  // use cheerio
  // find script.src, 
  // copy over the corresponding file from users src folder
  // 
  // find components
  // 
  const $ = cheerio.load(content.html, options, false);

  // Get Components
  let cayoIds = [];
  $('[cayo-id]').each(() => cayoIds.push(this.data().cayoId));
  const componentNameRegex = /(?<name>\w+)-/; // Foo-{hash}
  const components = cayoIds.map(id => id.match(componentNameRegex).groups.name);

  // Build Entry JS

  // Get entry file name
  let userEntryFile = $('script[data-type="module"][src]')[0].src;

  // if no JS needed, remove entry point
  let js = '';
  if (cayoIds.length === 0 && !userEntryFile) {
    $('script[type="module"][src="./index.js"]').remove();
  } else {
    // define contents of ./index.js
    // components => import statements 
    for (let component of components) {
      js += `import ${component} from '/components/${component}.js';\n`;
    }
    // Read entry contents
    // then append it to js
    // + entry contents
  }

  return { html, css, js, components };
}

// Build the dep content (string) to be written later
function createDepContent(deps, entry) {

}

function addComponentImport() {

}

// Get entry file contents
function getEntryContent() {

}

