import fs from 'fs-extra';
import path from 'path';
import { JSDOM } from 'jsdom';
import logger from '../logger.js';
import { generateCayoComponentId } from '../utils.js';
import { Renderer } from './renderer.js';
import { generateCayoRuntime, generateRuntimeIssuesScript } from '../codegen.js';
import { compileCayos } from '../compile/cayos.js';
import { getDeps } from '../bundle.js';
import { handleDependencies } from '../dependencies.js';

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
      if (el.dataset.cayoWarn) {
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
      if (cayoInstances[name]) {
        cayoInstances[name].push(id);
      } else {
        cayoInstances[name] = [id];
      }
      // Include the assets needed by a cayo
      // CSS is the only thing currently output other than the component JS
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

  // Get user-specified entry placeholder
  const entryScriptPlaceholder = document.querySelector('script[data-cayo-entry]');
  let entryScriptSrc = entryScriptPlaceholder ? entryScriptPlaceholder.src : '';
  // This is injected by Renderer.render based on the template
  const entryScript = document.querySelector(`script[type="module"][src="./index.js"]`);

  if (entryScriptSrc) {
    // Remove user-specified entry file placeholder
    entryScriptPlaceholder.remove();
    // Validate the file path
<<<<<<< HEAD
    const absoluteEntrySrcPath = path.resolve(config.src, entryScriptSrc);
    if (!fs.pathExistsSync(absoluteEntrySrcPath)) {
      let relativePath = entryScriptSrc.replace(config.projectRoot, '');
      errors.page.entryFileDoesNotExist = {
=======
    if (userEntryFile.startsWith('/')) {
      userEntryFile = userEntryFile.substring(1);
      const entryFilePath = path.resolve(config.src, userEntryFile);
      if (!fs.pathExistsSync(entryFilePath)) {
        let relativePath = entryFilePath.replace(config.projectRoot, '');
        errors.page.entryFileDoesNotExist = {
          title: `Bad entry file`,
          src: page.sourcePath.replace(config.pages, ''),
          message: `Entry file '${relativePath}' does not exist.`,
          log: `Entry file '${userEntryFile}' does not exist.`,
        }
        // Remove the placeholder entry file script tag because the file doesn't exist
        if (entryScriptPlaceholder) {
          entryScriptPlaceholder.remove();
        }
      } else {
        try {
          const entrySource = await fs.readFile(entryFilePath, { encoding: 'utf8' });
          if (entrySource) entry.code = entrySource;
          entry.path = entryFilePath;
          _cayo.stats.dependencies.pages[page.sourcePath].add(entry.path);
          handleEntryDependencies(page, entry, _cayo);
        } catch (err) {
          throw err;
        }
      }

    } else {
      errors.page.entryNotRelative = {
>>>>>>> b63b572 (wip: #71; replaced absolute paths with src-relative paths to keep vite happy)
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
  const warningScript = generateRuntimeIssuesScript({ config, document, page }, warnings, 'warning');
  if (config.mode === 'development') {
    document.body.appendChild(warningScript);
  }
  // Append runtime errors
  const errorScript = generateRuntimeIssuesScript({ config, document, page }, errors,  'error');
  if (config.mode === 'development') {
    document.body.appendChild(errorScript);;
  }

  // Construct the correct HTML string based on the document structure
  // that was rendered from the source (jsdom wraps the source HTML in a document,
  // which always includes `html`, `head`, and `body`, even if the source doesn't)
  const tags = tagsExist(content.html);
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

function tagsExist(source) {
  const head = source.match(/\<head[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/head\>/g);
  const body = source.match(/\<body[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/body\>/g);
  const html = source.match(/\<html[\s\S]*\>(?<innerHTML>[\s\S]*)\<\/html\>/g);
  return {
    head: head === null ? false : true,
    body: body === null ? false : true,
    html: html === null ? false : true,
  };
}
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======

// TODO: add links to relevant docs
// Generate console warnings that need to show in the browser
function generateRuntimeIssuesScript(runtime, issues, type) {
  const { config, document, page } = runtime;
  const script = document.createElement('script');

  // Formattign and label stuff
  let prefix = 'Warning';
  let f_log = (str) => str;
  let f_prefix = prefix
  let consoleType = 'log';
  if (type === 'warning') {
    prefix = 'Warning';
    f_log = chalk.yellow;
    f_prefix = chalk.yellow.bold(prefix);
    consoleType = 'warn';
  } else if (type === 'error') {
    prefix = 'Error';
    f_log = chalk.redBright;
    f_prefix = chalk.redBright.bold(prefix);
    consoleType = 'error';
  }
  
  const { 
    cayos: cayoIssues, 
    page: pageIssues,
  } = issues;

  script.innerHTML = `/* ${prefix}s for this page. See issues in console. */\n`;

  // Handle issues derived during initial compilation
  if (Object.keys(cayoIssues).length > 0) {
    for (const cayoId in cayoIssues) {
      let message = `Cayo ${prefix}: Cayo '${cayoId}' has runtime issues.\n\n`;
      for (const key in cayoIssues[cayoId]) {
        const issue = cayoIssues[cayoId][key];
        message += `${issue.title}: ${issue.message}\n\n`;
        if (cayoId !== 'undefined') {
          message += `Hint: review instances of <Cayo src="${issue.src}"> intended to be rendered on page '${page.sourcePath.replace(config.pages, '')}'\n`;
        } else {
          message += `Hint: review instances of <Cayo src={<undefined>}> or <Cayo> without a src prop intended to be rendered on page '${page.sourcePath.replace(config.pages, '')}'\n`;
        }
        if (issue.log) {
          logger.log.info(
            `${f_log(`${f_prefix}: ${issue.log}`)} ${chalk.dim(`${page.name}`)}`, 
            { timestamp: true, clear: false, }
          );
        }
      }
      script.innerHTML += `console.${consoleType}(\`${message}\`);\n`;
    }
  }
  // Handle issues based on parsing the rendered HTML
  if (Object.keys(pageIssues).length > 0) {
    for (const key in pageIssues) {
      const issue = pageIssues[key];
      let message = `${prefix}: page '${page.name}' has runtime issues.\n\n`;
      message += `${issue.title}: ${issue.message}\n\n`;
      script.innerHTML += `console.${consoleType}(\`${message}\`);\n`;
      logger.log.info(
        `${f_log(`${f_prefix}: ${issue.log}`)} ${chalk.dim(`${page.name}`)}`, 
        { timestamp: true, clear: false, }
      );
    }
  }

  return script;
}

async function handleEntryDependencies(page, entry, _cayo) {
  const { config } = _cayo;
  let imports = precinct(entry.code, { type: 'es6', includeCore: false });
  // Filter out public path ('/') and node_modules ('<package>')
  let localDeps = imports.filter(d => d.startsWith('../') || d.startsWith('./'));
  let absoluteDeps = localDeps.map(d => path.resolve(path.dirname(entry.path), d));
  let srcRelativeLocalDeps = localDeps.map((d, i) => {
    let pageCayoPath = path.resolve(config.cayoPath, page.url === '/' ? './' : page.url);
    return path.relative(pageCayoPath, absoluteDeps[i]);
  });
  // let nodeModules = imports
  //   .filter(d => !d.startsWith('../') && !d.startsWith('./') && !d.startsWith('/'))
  //   .map(d => path.relative(config.cayoPath, `${config.projectRoot}/node_modules/${d}`));
  
  entry.dependencies = [];
  for (let i = 0; i < localDeps.length; i++) {
    entry.dependencies.push([localDeps[i], srcRelativeLocalDeps[i]]);
  }


  const depender = { 
    type: 'entry', 
    path: entry.path, 
    dependencies: absoluteDeps, 
  }
  await handleDependencies(depender, _cayo);
}
>>>>>>> b63b572 (wip: #71; replaced absolute paths with src-relative paths to keep vite happy)
