import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { generateGetProps } from './codegen.js';

// Write file content for a page
export async function writePageFiles(page, outDir, logger, config) {
  const { html, css, js, entry } = page;
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  // Write HTML
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => logger.info(
      chalk.green('page rebuild ') + chalk.dim(`${page.filePath}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '' && !config.css.internal) {
    const cssPath = page.urlPath === '/' ? 'index.css' : `${page.filePath}/index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css)
      .then(() => logger.info(
        chalk.green('css rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }
  // Write Cayo runtime JS
  if (js.code !== '') {
    let jsPath = page.urlPath === '/' ? 'cayo-runtime.js' : `${page.filePath}/cayo-runtime.js`;
    let content = '';
    content += js.code;
    await fs.outputFile(path.resolve(outDir, jsPath), content)
      .then(() => logger.info(
        chalk.green('page runtime rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }

  // Copy user entry JS
  if (entry.path !== '') {
    let entryRelativePath = page.urlPath === '/' ? `./index.js` : `${page.filePath}${path.sep}index.js`;
    await fs.copy(entry.path, path.resolve(outDir, entryRelativePath))
      .then(() => logger.info(
        chalk.green('entry rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      ).catch(err => console.error(err));
  }
}

export async function writeComponentFile(name, modulePath, outDir, logger) {
  let content = `export { default as ${name} } from '${modulePath}';\n`;
  await fs.outputFile(path.resolve(outDir, `./__cayo/components/${name}.js`), content)
    .then(() => logger.info(
      chalk.green('component dep ') + chalk.dim(`${name}`), 
      { timestamp: true })
    );
}