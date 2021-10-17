import fs from 'fs-extra';
import path from 'path';
const __dirname = path.resolve();
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Renderer } from './renderer.js';
import chalk from 'chalk';
// import { getComponentModules, getComponentModulePaths } from './utils.js';
// import { writeComponentFile } from './files.js';

export function prerender(Template, pages, config) {
  const template = Template.render();
  const renderer = new Renderer(template.html);
  const componentList = new Set();

  // const prerendered = {};
  // Render page, parse html, and save its deps
  const prerendered = Object.entries(pages).reduce(
    (prerendered, [pathname, page]) => {
      // Render page
      const content = renderer.render(pathname, page);
      // Postprocess the content, get deps and inject dep references
      const { html, css, js, components } = handlePageDeps(content, page, config);
      prerendered[pathname] = {
        html,
        css, 
        js,
        components,
        ...page,
      }
      Object.keys(components).forEach(component => componentList.add(component))
      return prerendered;
    }, {}
  );

  return { 
    prerendered,
    componentList,
  }
}

// Derive JS dependencies from the prerendered html
export function handlePageDeps(content, page, config) {
  const $ = cheerio.load(content.html);
  const dom = new JSDOM(content.html);
  const { document } = dom.window;

  // Get component instance ids
  let cayoIds = [];
  document.querySelectorAll('[data-cayo-id]').forEach((el) => {
    cayoIds.push(el.dataset.cayoId);
  });

  // Get component list
  // TODO: make this regex allow '-' character, before the last one, to be part of the component name?
  const componentNameRegex = /(?<name>\w+)-/; // Foo-{hash}
  const components = cayoIds.reduce((components, id) => {
    let name = id.match(componentNameRegex).groups.name;
    // Collect keys of components, and an array of their respective instance ids
    if (!components[name]) {
      components[name] = [id]
    } else {
      components[name].push(id);
    }
    return components;
  }, {});

  // Get user-specified entry file name
  const entryScripts = document.querySelectorAll('script[data-cayo-entry]');
  const userEntryFile = entryScripts.length !== 0 ? entryScripts[0].src : '';
  // Remove user-specified entry file placeholder
  if (userEntryFile) { 
    entryScripts.forEach((script) => {
      script.remove();
    });
  }

  // Build generated entry file contents
  let js = '';
  if (cayoIds.length === 0 && !userEntryFile) {
    // Remove the entry point script tag if the page doesn't need any JS
    // This is injected by Renderer.render based on the template
    const entryScript = document.querySelector(`script[type="module"][src="./index.js"]`);
    if (entryScript) {
      entryScript.remove();
    } else {
      config.logger.info(
        chalk.bgRed.white(`No entry placeholder in '__index.svelte'.`) + chalk.dim(` Cayo components will not render.`), 
        { timestamp: true }
      );
    }
  } else {
    // Read entry contents
    const entryFilePath = path.resolve(
      page.modulePath.replace(/\/(\w+)\.svelte/, ''), 
      userEntryFile
    );
    const entryFileExists = fs.pathExistsSync(entryFilePath);
    if (entryFileExists) {
      js += `import '${entryFilePath}';\n`;
    } else {
      console.error(`Can't read entry file ${userEntryFile} in ${page.modulePath}`);
    }

    // Handle components as deps
    if (Object.keys(components).length !== 0) {
      // Add getProps helper for runtime
      let runtimePath = path.resolve(__dirname, './src/runtime.js');
      js += `import { getProps } from '${runtimePath}';\n`;
      
      // TODO: make this be constructred properly using page.filePath?
      const componentPath = path.resolve(process.cwd(), config.outDir, './generated/components');

      let instances = '';
      // TODO: test that this works
      Object.entries(components).forEach(([name, ids]) => {
        // Add component dependency import
        js += `import { ${name} } from '${componentPath}/${name}.js';\n`;
        // Generate component instances
        ids.forEach(id => {
          instances += genComponentInstance(id, name)
        });
      });

      // Add component instances
      js += genComponentInstanceWrapper(instances);
    }
  }

  const processedHTML = dom.window.document.documentElement.outerHTML;
  return { 
    html: processedHTML, 
    css: content.css, 
    js, 
    components 
  };
}

// UTILITIES
// ────────────────────────────────────

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
    props: getProps('${cayoId}'),
  });
`
  );
}
