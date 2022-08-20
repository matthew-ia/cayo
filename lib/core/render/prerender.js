import fs, { pathExists } from 'fs-extra';
import path from 'path';
import { JSDOM } from 'jsdom';
import chalk from 'chalk';
import { Renderer } from './renderer.js';
import { logger } from '../logger.js';
import { generateCayoRuntime } from '../codegen.js';
import { generateCayoComponentId } from '../utils.js';
import { compileCayos } from '../compile/cayos.js';

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
  // TODO: figure out what to do with this passed cayoComponents thing
  //       I think this was for during runtime, we accumulate a list of ids for each 
  //       name, instead of having to rebuild the entire list every time.
  // const componentNames = Object.keys(cayoComponents);

  const tags = findDocumentTags(content.html);
  const dom = new JSDOM(content.html);
  const { document } = dom.window;
  const warnings = {};

  // Get component instance ids
  const cayoIds = [];
  const cayoInstances = {};
  const cayoAssets = {};

  for (const el of document.querySelectorAll('[data-cayo-src]')) {
    let src = el.dataset.cayoSrc;
    if (src !== '') {
      const { id, name } = generateCayoComponentId(src);
      cayoIds.push(id);
      el.dataset.cayoId = id;

      // Get warnings added by the Cayo component during compile time
      if (el.dataset.cayoWarn) {
        warnings[id] = JSON.parse(el.dataset.cayoWarn);
      }
      
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

      const [cayo] = await compileCayos({ [name]: _cayo.stats.cayoComponents[name] }, _cayo);
      if (cayoInstances[name]) {
        cayoInstances[name].push(id);
      } else {
        cayoInstances[name] = [id];
      }
      if (!cayoAssets[name]) {
        cayoAssets[name] = { 
          css: { 
            code: cayo.output.css.code 
          } 
        };
      }
      
    } else {
      // At least one error will be reported if the src is invalid
      if (el.dataset.cayoWarn) {
        warnings['undefined'] = JSON.parse(el.dataset.cayoWarn);
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

  const needsEntryFile = (!userEntryFile && cayoIds.length > 0);
  if (Object.keys(warnings).length > 0 || needsEntryFile) {
    if (config.mode === 'development') {
      const warningScript = handleWarnings({ config, page, document }, warnings, needsEntryFile);
      document.body.appendChild(warningScript);;
    }
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
      logger.log.info(
        chalk.red(`No entry placeholder in template file.`) + chalk.dim(` Cayo components will not render.`), 
        { timestamp: true }
      );
    }
  }

  if (userEntryFile[0] === '/') {
    userEntryFile = userEntryFile.substring(1);
  } else if (userEntryFile && userEntryFile[0] !== '/') {
    logger.error.warn(
      chalk.red(
        `Entry file path '${userEntryFile}' requires a leading slash and to be relative to src`
      ) + chalk.dim(` ${page.name}`), 
      { timestamp: true, clear: false, }
    );
  }

  if (userEntryFile) {
    const entryFilePath = path.resolve(
      config.src,
      userEntryFile
    );
  
    if (!fs.pathExistsSync(entryFilePath)) {
      console.error(`Can't read entry file ${userEntryFile} in ${page.name}`);
    } else {
      entry.path = entryFilePath;
    }
  }
  
  js = generateCayoRuntime(cayoInstances, config);

  // Construct the correct HTML string based on the document tags
  // that were rendered from the source (jsdom wraps the source HTML in a document,
  // which always includes `html`, `head`, and `body`, even if the source doesn't)
  let processedHTML = '';
  if (tags.html) {
    processedHTML = document.documentElement.outerHTML;

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

// TODO: add links to relevant docs
// Generate console warnings for Cayos that will fire during runtime
function handleWarnings(runtime, warnings, needsEntryFile) {
  const { config, page, document } = runtime;
  const script = document.createElement('script');
    script.innerHTML = '/* Cayo instance warnings for this page, to be show in the runtime console. */\n';
    // Handle warnings derived during initial compilation
    // E.g., Bad props and Invalid src
    if (Object.keys(warnings).length > 0) {
      for (const cayoId in warnings) {
        let message = `Cayo Warning: Cayo '${cayoId}' may have runtime issues.\n\n`;
        for (const key in warnings[cayoId]) {
          const warning = warnings[cayoId][key];
          message += `${warning.title}: ${warning.message}\n\n`;
          if (cayoId !== 'undefined') {
            message += `Hint: review instances of <Cayo src="${warning.src}"> intended to be rendered on page '${page.sourcePath.replace(config.pages, '')}'\n`;
          } else {
            message += `Hint: review instances of <Cayo src={<undefined>}> or <Cayo> without a src prop intended to be rendered on page '${page.sourcePath.replace(config.pages, '')}'\n`;
          }
          if (warning.log) {
            logger.log.info(
              `${chalk.yellow(`${warning.log}`)} ${chalk.dim(`${page.name}`)}`, 
              { timestamp: true, clear: false, }
            );
          }
        }
        script.innerHTML += `console.warn(\`${message}\`);\n`;
      }
    }
    // Handle warnings based on parsing the rendered HTML
    // E.g., No entry file, but cayos are being rendered
    if (needsEntryFile) {
      let message = `Cayo Warning: No entry file found on the page. Cayos will not render.`;
      script.innerHTML += `console.warn(\`${message}\n\n\`'));\n`;
      logger.log.info(
        `${chalk.yellow(`${message}`)} ${chalk.dim(`${page.name}`)}`, 
        { timestamp: true, clear: false, }
      );
    }
    
    return script;
}