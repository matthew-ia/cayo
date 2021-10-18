import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Write file content for a page
export async function writePageFiles(page, config) {
  const { html, css, js } = page;
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  // Write HTML
  await fs.outputFile(path.resolve(config.outDir, `${htmlPath}`), html)
    .then(() => config.logger.info(
      chalk.green('page rebuild ') + chalk.dim(`${page.filePath}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '' && !config.css.useStyleTags) {
    const cssPath = page.urlPath === '/' ? 'index.css' : `${page.filePath}/index.css`;
    await fs.outputFile(path.resolve(config.outDir, cssPath), css)
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
        chalk.green('entry rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }
}

export async function writeComponentFile(name, modulePath, config) {
  let content = `export { default as ${name} } from '${modulePath}';\n`;
  await fs.outputFile(path.resolve(config.outDir, './generated', `components/${name}.js`), content)
    .then(() => config.logger.info(
      chalk.green('component dep ') + chalk.dim(`${name}`), 
      { timestamp: true })
    );
}