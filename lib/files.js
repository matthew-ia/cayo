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
  if (css.code !== '' && !config.css || !config.css.useStyleTags) {
    const cssPath = page.urlPath === '/' ? 'index.css' : `${page.filePath}/index.css`;
    await fs.outputFile(path.resolve(outDir, cssPath), css)
      .then(() => logger.info(
        chalk.green('css rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }
  // Write JS
  if (js.code !== '') {
    let jsPath = page.urlPath === '/' ? 'cayo-entry.js' : `${page.filePath}/cayo-entry.js`;
    let runtimePath = page.urlPath === '/' ? './cayo-runtime.js' : `../cayo-runtime.js`;
    // let content = `import { getProps } from '${runtimePath}';\n`;
    let content = '';
    content += js.code;
    await fs.outputFile(path.resolve(outDir, jsPath), content)
      .then(() => logger.info(
        chalk.green('page runtime rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      );
  }

  if (entry.path !== '') {
    let entryRelativePath = page.urlPath === '/' ? `./index.js` : `${page.filePath}${path.sep}index.js`;
    // console.log('entry.path', entry.path);
    // console.log('page.filePath', page.filePath);
    // console.log('outDir', outDir);
    // console.log('entryRelativePath', entryRelativePath, path.resolve(outDir, entryRelativePath));
    await fs.copy(entry.path, path.resolve(outDir, entryRelativePath))
      .then(() => logger.info(
        chalk.green('entry rebuild ') + chalk.dim(`${page.filePath}`), 
        { timestamp: true })
      ).catch(err => console.error(err));

    // let entryPath = path.resolve(config.src, )
  }
}

export async function copyMain(page, outDir, logger, config) {

}

async function handleEntryFile(entry, outDir, config) {
  
}

export async function writeComponentFile(name, modulePath, outDir, logger) {
  let content = `export { default as ${name} } from '${modulePath}';\n`;
  await fs.outputFile(path.resolve(outDir, `./generated/components/${name}.js`), content)
    .then(() => logger.info(
      chalk.green('component dep ') + chalk.dim(`${name}`), 
      { timestamp: true })
    );
}