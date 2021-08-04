
import { getComponentModulePaths } from './utils.js';
import { Renderer } from './renderer.js';
import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';

const development = import.meta.env.DEV;

export async function prerender(options, resolvedProjectRoot) {
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
    const { html, css, js, components } = await handlePageDeps(content, page);

    Object.keys(components).forEach(component => componentList.add(component))

    await writeContent({ html , css, js }, page, options.outDir);
  });

  // Do something with componentList
  writeComponentFiles(componentList, resolvedProjectRoot);
}

async function writeContent(content, page, outDir) {
  const { html, css, js } = content;
  
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => console.log('🖨   Prerendered', `${htmlPath}`));

  if (css.code !== '') {
    await fs.outputFile(path.resolve(outDir, `${page.filePath}index.css`), css.code)
      .then(() => console.log('🎨   CSS output for', `${page.filePath}.html`));
  }

  if (js !== '') {
    let jsPath = page.urlPath === '/' ? 'index.js' : `${page.filePath}/index.js`;
    await fs.outputFile(path.resolve(outDir, jsPath), js)
      .then(() => console.log('🛠   JS output for', `${page.filePath}.html`));
  }
}

export function getPages(modules, ext = 'svelte') {
  // TODO: build path from config

  console.log(modules);
  const extRegex = new RegExp(String.raw`(\.${ext})$`);

  return Object.entries(modules).reduce((pages, [modulePath, page]) => {
    // Make these paths actually useful
    // /^(.+)\/pages/
    // /^(\/\w+)*\/pages/
    const filePath = modulePath.replace(/^(.+)\/pages\//, '').replace(extRegex, '')
    const urlPath = filePath === 'index' ? filePath.replace(/index$/, '/') : `${filePath}/`
    // name = name.split('.', 1)[0];
    pages[urlPath] = {
      Component: page.default,
      meta: page.meta ? page.meta : {},
      filePath,
      modulePath,
      urlPath
    }
    return pages
  }, {})
}

export async function getComponents(resolvedProjectRoot) {
  const componentPaths = await getComponentModulePaths(resolvedProjectRoot);
  const componentNameRegex = /\/(?<name>\w+)\.svelte/; // Foo-{hash}
  const componentNamesFromPaths = componentPaths.map(path => path.match(componentNameRegex).groups.name);

  const paths = {};
  componentNamesFromPaths.forEach((name, i) => modules[name] = componentPaths[i]);

  return paths;
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
export async function handlePageDeps(content, page) {
  const { modulePath } = page;
  // use cheerio
  // find script.src, 
  // copy over the corresponding file from users src folder
  // 
  // find components
  // 
  // let options = null;
  const $ = cheerio.load(content.html);

  // Get Components
  let cayoIds = [];
  $('[data-cayo-id]').each(() => cayoIds.push(this.data().cayoId));
  const componentNameRegex = /(?<name>\w+)-/; // Foo-{hash}
  const components = {};
  cayoIds.forEach(id => {
    let name = id.match(componentNameRegex).groups.name;
    if (!components[name]) {
      components[name] = { id }
    }
  });
  // const components = cayoIds.map(id => {
  //   let name = id.match(componentNameRegex).groups.name;
  //   return { id, name };
  // });

  // Build Entry JS

  // Get entry file name
  let entryScriptEl = $('[data-cayo-entry-src]');
  console.log(entryScriptEl.length !== 0 ? entryScriptEl.first().data().cayoEntrySrc : 'no entry');
  let userEntryFile = entryScriptEl.length !== 0 ? entryScriptEl.first().data().cayoEntrySrc : '';

  // if no JS needed, remove entry point
  let js = '';
  if (cayoIds.length === 0 && !userEntryFile) {
    // Remove the entry point script tag if the page doesn't need any JS
    $('script[type="module"][src="./index.js"]').remove();
  } else {
    // define contents of ./index.js
    if (Object.keys(components).length !== 0) {
      // Add getProps helper for runtime
      js += `import { getProps } from 'cayo-utils.js';`;

      // Add component dependencies
      // TODO: make this be constructred properly using page.filePath
      let componentPath = '..';
      Object.entries(components).forEach(([componentName]) => {
        js += `import { ${componentName} } from '${componentPath}/components.js';\n`;
      });

      // Add component instances
      let instances = '';
      Object.entries(components).forEach(([name, { id }]) => {
        instances += genComponentInstance(id, name);
      });

      js += genComponentInstanceWrapper(instances);

      await writeComponentFiles(components);
    }
    

    // Read entry contents
    let path = modulePath.replace(/\/(\w+)\.svelte/, '');
    console.log('path to entry: ', path);
    try {
      const entryContent = await fs.promises.readFile(`${path}/${userEntryFile}`, 'utf8');
      // then append it to js
      js += entryContent;
    } catch (err) {
      console.error(`Can't read entry file ${userEntryFile}\nReference: ${page.modulePath}\n\n`, err);
    }
  }

  return { 
    html: $.root().html(), 
    css: content.css, 
    js, 
    components 
  };
}

async function writeComponentFiles(components, outDir, resolvedProjectRoot) {
  const componentPaths = await getComponents(resolvedProjectRoot);

  Object.keys(components).forEach(async (name) => {
    let content = `export { default as ${name} } from '${componentPaths[name]}'`;

    await fs.outputFile(path.resolve(outDir, `./components.js`, content))
      .then(() => console.log(`Wrote file {outDir}/components/${name}.js`));
  });
}

function genComponentInstanceWrapper(contents) {
  return (
`
document.addEventListener('DOMContentLoaded', function() {
${contents}
});
`
  );
}

function genComponentInstance(cayoId, componentName) {
  return (
` 
  new ${componentName}({
    target: document.querySelector('[data-cayo-id="${cayoId}"]'),
    hydrate: true,
    props: { getProps('${cayoId}') },
  });
`
  );
}

// function getProps(el) {
//   const data = el.text();
//   el.remove();
//   return data;
// }

