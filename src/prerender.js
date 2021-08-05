import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';
import chalk from 'chalk';
import { Renderer } from './renderer.js';
import { getComponentModules } from './utils.js';

export async function prerender(Template, pages, config) {
  const template = Template.render();
  const renderer = new Renderer(template.html);
  const componentList = new Set();

  // Render page, parse html, and save its deps
  Object.entries(pages).forEach(async ([pathname, page]) => {
    // Render page
    const content = renderer.render(pathname, page);
    // Postprocess the content, get deps and inject dep references
    const { html, css, js, components } = await handlePageDeps(content, page);
    Object.keys(components).forEach(component => componentList.add(component))
    writeContent({ html , css, js }, page, config);
  });

  writeComponentFiles(componentList, config.projectRoot);
}

// Write file content for a page
async function writeContent(content, page, config) {
  const { html, css, js } = content;
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  // Write HTML
  await fs.outputFile(path.resolve(config.outDir, `${htmlPath}`), html)
    .then(() => config.logger.info(
      chalk.green('page rebuild ') + chalk.dim(`${htmlPath}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '') {
    await fs.outputFile(path.resolve(config.outDir, `${page.filePath}index.css`), css.code)
      .then(() => config.logger.info(
        chalk.green('css rebuild ') + chalk.dim(`${page.filePath}.html`), 
        { timestamp: true })
      );
  }
  // Write JS
  if (js !== '') {
    let jsPath = page.urlPath === '/' ? 'index.js' : `${page.filePath}/index.js`;
    await fs.outputFile(path.resolve(config.outDir, jsPath), js)
      .then(() => config.logger.info(
        chalk.green('entry rebuild ') + chalk.dim(`for ${page.filePath}.html`), 
        { timestamp: true })
      );
  }
}

// Derive JS dependencies from the html
export async function handlePageDeps(content, page) {
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

  // Get user-specified entry file name
  let entryScripts = $('[data-cayo-entry-src]');
  let userEntryFile = entryScripts.length !== 0 ? entryScripts.first().data().cayoEntrySrc : '';
  // Remove user-specified entry file placeholder
  if (userEntryFile) entryScripts.remove();

  // Build generated entry file contents
  let js = '';
  if (cayoIds.length === 0 && !userEntryFile) {
    // Remove the entry point script tag if the page doesn't need any JS
    // This is injected by Renderer.render based on the template
    $('script[type="module"][src="./index.js"]').remove();
  } else {
    // Read entry contents
    const entryFilePath = path.resolve(
      page.modulePath.replace(/\/(\w+)\.svelte/, ''), 
      userEntryFile
    );
    const entryFileExists = await fs.pathExists(entryFilePath);
    if (entryFileExists) {
      js += `import '${entryFilePath}';`;
    } else {
      console.error(`Can't read entry file ${userEntryFile} in ${page.modulePath}`);
    }

    // Handle components as deps
    if (Object.keys(components).length !== 0) {
      // Add getProps helper for runtime
      js += `import { getProps } from 'cayo-utils.js';`;

      // Add component dependencies
      // TODO: make this be constructred properly using page.filePath
      const componentPath = '..';
      Object.entries(components).forEach(([componentName]) => {
        js += `import { ${componentName} } from '${componentPath}/components.js';\n`;
      });

      // Add component instances
      // TODO: test that this works
      let instances = '';
      Object.entries(components).forEach(([name, { id }]) => {
        instances += genComponentInstance(id, name);
      });

      js += genComponentInstanceWrapper(instances);
      await writeComponentFiles(components);
    }
  }

  return { 
    html: $.root().html(), 
    css: content.css, 
    js, 
    components 
  };
}

// Generate re-xport files for components
async function writeComponentFiles(components, outDir, projectRoot) {
  const componentPaths = await getComponentModules(projectRoot);

  // TODO: make this use svelte/register & require
  Object.keys(components).forEach(async (name) => {
    let content = `export { default as ${name} } from '${componentPaths[name]}'`;
    await fs.outputFile(path.resolve(outDir, `./components.js`, content))
      .then(() => console.log(`Wrote file {outDir}/components/${name}.js`));
  });
}

// Generate the code to wrap component instances in an event listener wrapper
function genComponentInstanceWrapper(contents) {
  return (
`
document.addEventListener('DOMContentLoaded', function() {
${contents}
});
`
  );
}

// Generate the code for a component instance
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

/*

import MyComponent from './MyComponent.svelte';

window.MyComponent = function (config) {
    return new MyComponent(config);
};

document.addEventListener("DOMContentLoaded", function (event) {
  new MyComponent({
      target: document.getElementById("my-component"),
      hydrate: true,
      props: { ... },
  });
});


*/