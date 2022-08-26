import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import logger from './logger.js';
import { processEntrySource } from './entry.js';

// Write file content for a page
// TODO: wrap all fs stuff in try blocks (need the awaits?)
export async function writePageFiles(page, _cayo) {
  const { config } = _cayo;
  const outDir = config.cayoPath;
  const { html, css, js, cayoAssets } = page.result;
  const htmlPath = page.url === '/' ? 'index.html' : `${page.url}/index.html`;

  // Write HTML
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => logger.log.info(
      chalk.green('page build ') + chalk.dim(`${page.name}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '' && !config.css.internal) {
    const cssPath = page.url === '/' ? 'index.css' : `${page.url}/index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css)
      .then(() => logger.log.info(
        chalk.green('css build ') + chalk.dim(`${page.name}`), 
        { timestamp: true })
      );
  }
  // Write Cayo runtime JS
  if (js.code !== '') {
    let jsPath = page.url === '/' ? 'cayo-runtime.js' : `${page.url}/cayo-runtime.js`;
    let content = '';
    content += js.code;
    await fs.outputFile(path.resolve(outDir, jsPath), content)
      .then(() => logger.log.info(
        chalk.green('cayo runtime build ') + chalk.dim(`${page.name}`), 
        { timestamp: true })
      );
  }
  // Write Cayo CSS
  for (const [name, cayo] of Object.entries(cayoAssets)) {
    if (cayo.css.code !== '' && !config.css.internal) {
      const cssPath = `${name}.css`;
      await fs.outputFile(path.resolve(outDir, cssPath), cayo.css.code)
        .then(() => logger.log.info(
          chalk.green('css build ') + chalk.dim(`${cssPath}`), 
          { timestamp: true })
        );
    }
  }
}

export async function writeEntryFile(page, _cayo) {
  const { config } = _cayo;
  const { entry } = page.result;
  
  if (entry.path) {
    // Get the processed entry code
    let code = await processEntrySource(entry, page, _cayo);
    // Write the processed entry file
    let entryOutputPath = page.url === '/' ? `./index.js` : `${page.url}/index.js`;
    await fs.outputFile(path.resolve(config.cayoPath, entryOutputPath), code)
      .then(() => logger.log.info(
        chalk.green('entry build ') + chalk.dim(`${page.name}`), 
        { timestamp: true }
      ))
      .catch(err => console.error(err));
  }
}

export async function writeTemplateCSS(css, _cayo) {
  const { config } = _cayo;
  const outDir = config.cayoPath;
  
  if (css.code !== '' && !config.css.internal) {
    const cssPath = `__index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css.code)
      .then(() => logger.log.info(
        chalk.green('css build ') + chalk.dim(`${config.templateFileName}`), 
        { timestamp: true })
      );
  }
}

export function cleanCayoPath(cayoPath) {
  fs.removeSync(cayoPath);
  fs.ensureDirSync(cayoPath);
}