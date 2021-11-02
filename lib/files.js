import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Write file content for a page
export async function writePageFiles(page, outDir, logger, config) {
  const { html, css, js, entry } = page;
  const htmlPath = page.urlPath === '/' ? 'index.html' : `${page.filePath}/index.html`;
  // Write HTML
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => logger.info(
      chalk.green('page build ') + chalk.dim(`${page.filePath}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '' && !config.css.internal) {
    const cssPath = page.urlPath === '/' ? 'index.css' : `${page.filePath}/index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css)
      .then(() => logger.info(
        chalk.green('css build ') + chalk.dim(`${page.filePath}`), 
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
        chalk.green('cayo runtime build ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }

  // Copy user entry JS
  if (entry.path !== '') {
    let entryRelativePath = page.urlPath === '/' ? `./index.js` : `${page.filePath}${path.sep}index.js`;
    await fs.copy(entry.path, path.resolve(outDir, entryRelativePath))
      .then(() => logger.info(
        chalk.green('entry build ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      ).catch(err => console.error(err));
  }
}

export async function writeTemplateCSS(css, outDir, logger, config) {
  if (css.code !== '' && !config.css.internal) {
    const cssPath = `__index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css.code)
      .then(() => logger.info(
        chalk.green('css build ') + chalk.dim(`${config.templateFileName}`), 
        { timestamp: true })
      );
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

export function cleanCayoPath(cayoPath) {
  fs.removeSync(cayoPath);
  fs.ensureDirSync(cayoPath);
  // if (!fs.existsSync(cayoPath)) {
  //   try {
  //     fs.mkdirSync(cayoPath)
  //   } catch (err) {
  //     console.error(err);
  //   }
  // } else {
  //   try {
  //     fs.removeSync(cayoPath)
  //     fs.mkdirSync(cayoPath);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
}
