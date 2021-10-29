import fs from 'fs-extra';
import path from 'path';
const __dirname = path.resolve();
import { JSDOM } from 'jsdom';
import { Renderer } from './renderer.js';
import { 
  generateComponentInstanceWrapper, 
  generateCayoRuntime,
  generateComponentInstance,
  generateGetProps,
} from './codegen.js';
import chalk from 'chalk';
// import { getComponentModules, getComponentModulePaths } from './utils.js';
// import { writeComponentFile } from './files.js';

export function prerender(Template, pages, componentModules, config, logger) {
  const template = Template.render();
  const renderer = new Renderer(template.html);
  const componentList = new Set();

  // const prerendered = {};
  // Render page, parse html, and save its deps
  const prerendered = Object.entries(pages).reduce(
    (prerendered, [pathname, page]) => {
      // Render page
      const content = renderer.render(page, config);
      // Postprocess the content, get deps and inject dep references
      const { html, css, js, entry, components } = handlePageDeps(content, page, Object.keys(componentModules), config, logger);
      prerendered[pathname] = {
        html,
        css, 
        js,
        entry,
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
export function handlePageDeps(content, page, componentNames, config, logger) {
  const dom = new JSDOM(content.html);
  const { document } = dom.window;

  // Get component instance ids
  let cayoIds = [];
  document.querySelectorAll('[data-cayo-id]').forEach((el) => {
    if (el.dataset.cayoId !== '') {
      cayoIds.push(el.dataset.cayoId);
    } else {
      logger.info(
        chalk.red(`Cayo component instance without a name found`) + chalk.dim(` ${page.filePath}`), 
        { timestamp: true, clear: true, }
      );
    }
  });

  // Get component list
  // TODO: make this regex allow '-' character, before the last one, to be part of the component name?
  const componentNameRegex = /(?<name>\w+)-/; // Foo-{hash}
  const components = cayoIds.reduce((components, id) => {
    let name = id.match(componentNameRegex).groups.name;
    // Collect keys of components, and an array of their respective instance ids
    // if (!name) return components;
    // console.log('name', name);
    // if (!name) {
    //   return components;
    // }
    if (!componentNames.includes(name)) {
      logger.warn(
        chalk.red(
          `Cayo component with name '${name}' does not exist but is trying to be rendered`
        ) + chalk.dim(` ${page.filePath}`), 
        { timestamp: true, clear: true, }
      );
      return components;
    }

    if (!components[name]) {
      components[name] = [id]
    } else {
      components[name].push(id);
    }
    return components;
  }, {});

  // Get user-specified entry file name
  // TODO: can just be querySelector? should only be one instance. maybe warn if more than one.
  const entryScripts = document.querySelectorAll('script[data-cayo-entry]');
  const userEntryFile = entryScripts.length !== 0 ? entryScripts[0].src : '';
  // Remove user-specified entry file placeholder
  if (userEntryFile) { 
    entryScripts.forEach((script) => {
      script.remove();
    });
  }

  // Build generated entry file contents
  let js = { code: '' };
  let entry = {
    pagePath: page.filePath,
    path: '',
  }
  if (cayoIds.length === 0 && !userEntryFile) {
    // Remove the entry point script tag if the page doesn't need any JS
    // This is injected by Renderer.render based on the template
    const entryScript = document.querySelector(`script[type="module"][src="./index.js"]`);
    if (entryScript) {
      entryScript.remove();
    } else {
      logger.info(
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
    entry.path = entryFilePath;

    const entryFileExists = fs.pathExistsSync(entryFilePath);
    // if (entryFileExists) {
    //   js += `import '${entryFilePath}';\n`;
    // } else {
    //   console.error(`Can't read entry file ${userEntryFile} in ${page.modulePath}`);
    // }
    if (!entryFileExists) {
      console.error(`Can't read entry file ${userEntryFile} in ${page.modulePath}`);
    }

    js = generateCayoRuntime(components, config);
    // console.log(js);

    // Handle components as deps
    // if (Object.keys(components).length !== 0) {
      
      
    //   // TODO: make this be constructred properly using page.filePath?
    //   const componentPath = path.resolve(config.cayoPath, './generated/components');

    //   let instances = '';
    //   // TODO: test that this works
    //   Object.entries(components).forEach(([name, ids]) => {
    //     // Add component dependency import
    //     js += `import { ${name} } from '${componentPath}/${name}.js';\n`;
    //     // Generate component instances
    //     ids.forEach(id => {
    //       instances += generateComponentInstance(id, name)
    //     });
    //   });

      // Add getProps helper for runtime 
      // THis is a dependency for the generated component instances
      // js += generateGetProps();

      // Add component instances
      // js += generateComponentInstanceWrapper(instances);
    // }
  }

  const processedHTML = dom.window.document.documentElement.outerHTML;
  return { 
    html: processedHTML, 
    css: content.css.code, 
    js, 
    components,
    entry,
  };
}
