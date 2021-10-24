import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Write file content for a page
export async function writePageFiles(page, outDir, logger, config) {
  const { html, css, js } = page;
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  // Write HTML
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => logger.info(
      chalk.green('page rebuild ') + chalk.dim(`${page.filePath}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '' && !config.css || !config.css.useStyleTags) {
    const cssPath = page.urlPath === '/' ? 'index.css' : `${page.filePath}/index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css)
      .then(() => logger.info(
        chalk.green('css rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }
  // Write JS
  if (js !== '') {
    let jsPath = page.urlPath === '/' ? 'index.js' : `${page.filePath}/index.js`;
    await fs.outputFile(path.resolve(outDir, jsPath), js)
      .then(() => logger.info(
        chalk.green('entry rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }
}

export async function writeComponentFile(name, modulePath, outDir, logger) {
  let content = `export { default as ${name} } from '${modulePath}';\n`;
  console.log(outDir);
  await fs.outputFile(path.resolve(outDir, `./generated/components/${name}.js`), content)
    .then(() => logger.info(
      chalk.green('component dep ') + chalk.dim(`${name}`), 
      { timestamp: true })
    );
}