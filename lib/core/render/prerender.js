import fs from 'fs-extra';
import path from 'path';
import { JSDOM } from 'jsdom';
import { Renderer } from './renderer.js';
import { compileCayos } from '../compile/cayos.js';
import { generateCayoRuntime, generateRuntimeIssuesScript } from '../codegen.js';
import { generateCayoComponentId } from '../utils.js';
import logger from '../logger.js';

export async function prerender(page, _cayo) {
  const renderer = new Renderer(page.layout);
  const componentList = new Set();

  const content = await renderer.render(page, _cayo.config);
  // Postprocess the content, get deps and inject dep references
  const processed = await processPage(
    content, 
    page, 
    _cayo, 
    logger
  );

  const { cayoInstances } = processed;

  Object.keys(cayoInstances).forEach(component => componentList.add(component))

  return {
    ...processed,
    components: [...componentList],
  }
}

// Derive JS dependencies from the prerendered html
export async function processPage(content, page, _cayo, logger) {
  const { config } = _cayo;
  // JSDOM Initialization
  const dom = new JSDOM(content.html);
  const { document } = dom.window;
  // For storing issues while we process the page
  const warnings = {
    cayos: {},
    page: {},
  };
  const errors = {
    cayos: {},
    page: {},
  };
  // For generated file contents
  let js = { code: '' };
  let entry = { path: '' };
  // Get component instance info
  const cayoIds = [];
  const cayoInstances = {};
  const cayoAssets = {};
  // Find all cayo instances in the markup
  for (const el of document.querySelectorAll('[data-cayo-src]')) {
    let src = el.dataset.cayoSrc;
    if (src !== '') {
      const { id, name } = generateCayoComponentId(src);
      cayoIds.push(id);
      el.dataset.cayoId = id;

      // Get warnings added by the Cayo component during compile time
      if (el.dataset.cayoWarn && el.dataset.cayoWarn !== '{}') {
        warnings.cayos[id] = JSON.parse(el.dataset.cayoWarn);
      }
      
      // Add cayos to stats for dependency handling
      let absoluteSrc = path.resolve(config.components, src);
      if (_cayo.stats.cayoComponents[name]) {
        _cayo.stats.cayoComponents[name].src = absoluteSrc;
        _cayo.stats.cayoComponents[name].pages.add(page.sourcePath);
      } else {
        _cayo.stats.cayoComponents[name] = { 
          src: absoluteSrc,
          pages: new Set([page.sourcePath]),
        }; 
      }
      _cayo.stats.dependencies.pages[page.sourcePath].add(absoluteSrc);      
      
      // Compile cayos & keep track of them for this page
      const [cayo] = await compileCayos({ [name]: _cayo.stats.cayoComponents[name] }, _cayo);
      // Store references of each cayo instance on the page
      if (cayoInstances[name]) {
        cayoInstances[name].push(id);
      } else {
        cayoInstances[name] = [id];
      }
      // Include the assets needed by a cayo
      // CSS is the only thing currently output other than the component JS
      if (cayo && !cayoAssets[name]) {
        cayoAssets[name] = { 
          css: { 
            code: cayo.output.css.code 
          } 
        };
      }
      
    } else {
      // At least one error will be reported if the src is invalid
      if (el.dataset.cayoWarn) {
        warnings.cayos['undefined'] = JSON.parse(el.dataset.cayoWarn);
      }
    }
    // Clean up data attributes we don't need during runtime
    delete el.dataset.cayoSrc;
    delete el.dataset.cayoWarn;
  }

  let cayoAssetCssElements = '';
  for (const [name, cayo] of Object.entries(cayoAssets)) {
    if (cayo.css.code !== '') {
      cayoAssetCssElements += config.css.internal 
        ? `<style>/* ${name} CSS */${cayo.css.code}</style>\n`
        : `<link rel="stylesheet" href="/${name}.css">\n`
    }
  }
  const cayoAssetsCssMarker = document.querySelector('link[data-cayo-assets-css]');
  cayoAssetsCssMarker.outerHTML = cayoAssetCssElements;

  // Get user-specified entry placeholder
  const entryScriptPlaceholder = document.querySelector('script[data-cayo-entry]');
  let entryScriptSrc = entryScriptPlaceholder ? entryScriptPlaceholder.src : '';
  // This is injected by Renderer.render based on the template
  const entryScript = document.querySelector(`script[type="module"][src="./index.js"]`);

  if (entryScriptSrc) {
    // Remove user-specified entry file placeholder
    entryScriptPlaceholder.remove();
    // Validate the file path
    const absoluteEntrySrcPath = path.resolve(config.src, entryScriptSrc);
    if (!fs.pathExistsSync(absoluteEntrySrcPath)) {
      let relativePath = entryScriptSrc.replace(config.projectRoot, '');
      errors.page.entryFileDoesNotExist = {
        title: `Bad entry file`,
        src: page.sourcePath.replace(config.pages, ''),
        message: `Entry file '${relativePath}' does not exist.`,
        log: `Entry file '${entryScriptSrc}' does not exist.`,
      }
      // Remove the entry file script because the file doesn't exist
      entryScript.remove();
    } else {
      entry.path = absoluteEntrySrcPath;
      _cayo.stats.dependencies.pages[page.sourcePath].add(absoluteEntrySrcPath);
    }
  } else {
    if (cayoIds.length > 0) {
      let message = 'An entry file is required in order to render Cayos on the page.'
      warnings.page.noEntryFile = {
        title: `No entry file`,
        src: page.sourcePath.replace(config.pages, ''),
        message: message,
        log: `No entry file found. ${message}`,
      }
    } else {
      // Remove the entry point script tag because the page doesn't need any JS
      entryScript.remove();
    }
  }

  // Generate JS for cayos to run in the browser as needed
  const cayoRuntimePath = page.url === '/' ? `/index.js` : `${page.url}/index.js`;
  js = generateCayoRuntime(cayoInstances, cayoRuntimePath, _cayo);

  // Indicate that we need to make this entry ready to render cayos later,
  // if there are cayo instances on this page
  if (cayoIds.length > 0) {
    entry.renderCayos = true;
  }
  
  // Append runtime warnings
  const { 
    script: warningScript, 
    logs: warningLogs 
  } = generateRuntimeIssuesScript({ config, document, page }, warnings, 'warning');
  if (config.mode === 'development') {
    document.body.appendChild(warningScript);
  }
  // Append runtime errors
  const { 
    script: errorScript, 
    logs: errorLogs,
  } = generateRuntimeIssuesScript({ config, document, page }, errors,  'error');
  if (config.mode === 'development') {
    document.body.appendChild(errorScript);;
  }
  // Log any runtime warnings and errors
  for (const message of [...warningLogs, ...errorLogs]) {
    logger.log.info(
      message, 
      { timestamp: true, clear: false, }
    );
  }
  
  // Construct the correct HTML string based on the document structure
  // that was rendered from the source (jsdom wraps the source HTML in a document,
  // which always includes `html`, `head`, and `body`, even if the source doesn't)
  const tags = tagsExist(content.html);
  let processedHTML = '';
  if (tags.doctype) {
    processedHTML += tags.doctype;
  }  
  if (tags.html) {
    processedHTML += document.documentElement.outerHTML;
  } else {
    if (tags.head) {
      processedHTML += document.head.outerHTML;
    } else {
      processedHTML += document.head.innerHTML;
    }

    if (tags.body) {
      processedHTML += document.body.outerHTML;
    } else {
      processedHTML += document.body.innerHTML;
    }
  }

  return { 
    html: processedHTML, 
    css: content.css.code, 
    js, 
    cayoInstances,
    cayoAssets,
    entry,
  };
}

function tagsExist(source) {
  const doctype = source.match(/\<!DOCTYPE\s\w*\>/g);
  const head = source.match(/\<head[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/head\>/g);
  const body = source.match(/\<body[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/body\>/g);
  const html = source.match(/\<html[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/html\>/g);
  return {
    doctype: doctype === null ? false : doctype,
    head: head === null ? false : true,
    body: body === null ? false : true,
    html: html === null ? false : true,
  };
}
