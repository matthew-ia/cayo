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
  if (css.code !== '') {
    await fs.outputFile(path.resolve(config.outDir, `${page.filePath}index.css`), css.code)
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

// Generate re-xport files for components
// export async function writeComponentFiles(components, outDir) {
//   const modules = await getComponentModules(config.projectRoot);

//   // TODO: make this use svelte/register & require
//   Object.keys(components).forEach(async (name) => {
//     let content = `export { default as ${name} } from '${modules[name].modulePath}'\n`;
//     await fs.outputFile(path.resolve(outDir, `./components.js`, content))
//       .then(() => console.log(`Wrote file ${outDir}/components/${name}.js`));
//   });
// }

export async function writeComponentFile(name, modulePath, config) {
  // let content = `import { createRequire } from 'module';\n`;
  // content += `const require = createRequire(import.meta.url);\n`;
  // content += `require('svelte/register');\n`;

  let content = `export { default as ${name} } from '${modulePath}';\n`;
  await fs.outputFile(path.resolve(config.outDir, './generated', `components/${name}.js`), content)
    .then(() => config.logger.info(
      chalk.green('component dep ') + chalk.dim(`${name}`), 
      { timestamp: true })
    );
    
    // console.log(`Wrote file ${outDir}generated/components/${name}.js`);
}