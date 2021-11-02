import fs from 'fs-extra';
import path from 'path';
import { JSDOM } from 'jsdom';
import { Renderer } from './renderer.js';
import { generateCayoRuntime } from './codegen.js';
import chalk from 'chalk';

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
      const { html, css, js, entry, components } = processPage(content, page, Object.keys(componentModules), config, logger);
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
export function processPage(content, page, componentNames, config, logger) {
  const tags = findDocumentTags(content.html);
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
  let userEntryFile = entryScripts.length !== 0 ? entryScripts[0].src : '';
  // Remove user-specified entry file placeholder
  if (userEntryFile) { 
    entryScripts.forEach((script) => {
      script.remove();
    });
  }

  // Build generated entry file contents
  let js = { code: '' };
  let entry = {
    path: '',
  }

  if (!userEntryFile) {
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
  }

  if (userEntryFile[0] === '/') {
    userEntryFile = userEntryFile.substring(1);
  } else if (userEntryFile && userEntryFile[0] !== '/') {
    logger.warn(
      chalk.red(
        `Entry file path '${userEntryFile}' requires a leading slash and to be relative to src`
      ) + chalk.dim(` ${page.filePath}`), 
      { timestamp: true, clear: true, }
    );
  }

  if (userEntryFile) {
    const entryFilePath = path.resolve(
      config.src,
      userEntryFile
    );
  
    if (!fs.pathExistsSync(entryFilePath)) {
      console.error(`Can't read entry file ${userEntryFile} in ${page.modulePath}`);
    } else {
      entry.path = entryFilePath;
    }
  }
  
  js = generateCayoRuntime(components, config);

  // Construct the correct HTML string based on the document tags
  // that were rendered from the source (jsdom wraps the source HTML in a document,
  // which always includes `html`, `head`, and `body`, even if the source doesn't)
  let processedHTML = '';
  if (tags.html) {
    processedHTML = dom.window.document.documentElement.outerHTML;

  } else {
    if (tags.head) {
      processedHTML += dom.window.document.head.outerHTML;
    } else {
      processedHTML += dom.window.document.head.innerHTML;
    }

    if (tags.body) {
      processedHTML += dom.window.document.body.outerHTML;
    } else {
      processedHTML += dom.window.document.body.innerHTML;
    }
  }

  return { 
    html: processedHTML, 
    css: content.css.code, 
    js, 
    components,
    entry,
  };
}


function findDocumentTags(source) {
  const head = source.match(/\<head[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/head\>/g);
  const body = source.match(/\<body[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/body\>/g);
  const html = source.match(/\<html[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/html\>/g);

  return {
    head: head === null ? false : true,
    body: body === null ? false : true,
    html: html === null ? false : true,
  };
}