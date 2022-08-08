import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { logger } from './logger.js';

// Write file content for a page
export async function writePageFiles(page, outDir, config) {
  const { html, css, js, entry } = page.result;
  const htmlPath = page.url === '/' ? 'index.html' : `${page.name}/index.html`;
  // Write HTML
  await fs.outputFile(path.resolve(outDir, `${htmlPath}`), html)
    .then(() => logger.log.info(
      chalk.green('page build ') + chalk.dim(`${page.name}`), 
      { timestamp: true })
    );
  // Write CSS
  if (css.code !== '' && !config.css.internal) {
    const cssPath = page.url === '/' ? 'index.css' : `${page.name}/index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css)
      .then(() => logger.log.info(
        chalk.green('css build ') + chalk.dim(`${page.name}`), 
        { timestamp: true })
      );
  }
  // Write Cayo runtime JS
  if (js.code !== '') {
    let jsPath = page.url === '/' ? 'cayo-runtime.js' : `${page.name}/cayo-runtime.js`;
    let content = '';
    content += js.code;
    await fs.outputFile(path.resolve(outDir, jsPath), content)
      .then(() => logger.log.info(
        chalk.green('cayo runtime build ') + chalk.dim(`${page.name}`), 
        { timestamp: true })
      );
  }

  // Copy user entry JS
  if (entry.path !== '') {
    let entryRelativePath = page.url === '/' ? `./index.js` : `${page.name}${path.sep}index.js`;
    await fs.copy(entry.path, path.resolve(outDir, entryRelativePath))
      .then(() => logger.log.info(
        chalk.green('entry build ') + chalk.dim(`${page.name}`), 
        { timestamp: true })
      ).catch(err => console.error(err));
  }
}

export async function writeTemplateCSS(css, outDir, config) {
  if (css.code !== '' && !config.css.internal) {
    const cssPath = `__index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css.code)
      .then(() => logger.log.info(
        chalk.green('css build ') + chalk.dim(`${config.templateFileName}`), 
        { timestamp: true })
      );
  }
}

// FIXME: Don't think we actually need this? Since compileComponents handles the writing
export async function writeComponentFile(component, outDir) {
  // let content = `export { default as ${component.name} } from '${modulePath}';\n`;
  await fs.outputFile(path.resolve(outDir, `./__cayo/components/${component.name}.js`), content)
    .then(() => logger.log.info(
      chalk.green('component dep ') + chalk.dim(`${component.name}`), 
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
