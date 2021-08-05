import crypto from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import fg from 'fast-glob';

export function getPageModules(modules, ext = 'svelte') {
  // TODO: build path from config
  const extRegex = new RegExp(String.raw`(\.${ext})$`);

  return Object.entries(modules).reduce((pages, [modulePath, page]) => {
    // Make these paths actually useful
    // /^(.+)\/pages/
    // /^(\/\w+)*\/pages/
    const filePath = modulePath.replace(/^(.+)\/pages\//, '').replace(extRegex, '')
    const urlPath = filePath === 'index' ? filePath.replace(/index$/, '/') : `${filePath}/`
    // name = name.split('.', 1)[0];
    pages[urlPath] = {
      Component: page.default,
      meta: page.meta ? page.meta : {},
      filePath,
      modulePath,
      urlPath
    }
    return pages
  }, {})
}

export async function getComponentModules(projectRoot) {
  const componentPaths = await getComponentModulePaths(projectRoot);
  const componentNameRegex = /\/(?<name>\w+)\.svelte/; // Foo-{hash}
  const componentNamesFromPaths = componentPaths.map(path => path.match(componentNameRegex).groups.name);

  const paths = {};
  componentNamesFromPaths.forEach((name, i) => modules[name] = componentPaths[i]);

  return paths;
}

export async function viteBuildScript(moduleName, verbose) {
  const cmd = 'vite';
  const args = [
    'build', 
    // Path to prerender config
    // TODO: this should be contained somewhere other than root of this package I think
    '--config', './vite.prerender.config.js', 
    // Output directory
    '--outDir', 'dist', 
    // File to build (output is runnable in node env)
    '--ssr', `src/${moduleName}.js`
  ];

  const options = verbose ? { shell: true, stdio: 'inherit' } : {}
  
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, options);
    // Resolve promise
    process.on('close', (code) => {
      resolve(code)
    });
    // Reject promise
    process.on('error', (err) => {
      console.error(`Error building module: src/${moduleName}.js`);
      console.error(err);
      reject(err)
    });
  });
}

export function hash(bytes = 5) {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function getPageModulePaths(projcetRoot) {
  return await fg([`${projcetRoot}/src/pages/**/*.svelte`]);
}

export async function getComponentModulePaths(projcetRoot) {
  return await fg([`${projcetRoot}/src/components/**/*.svelte`]);
}

export async function createPageManifest(projcetRoot, cayoPath) {
  const pagePaths = await getPageModulePaths(projcetRoot);
  // let importPages = '';
  let importPages = `import { createRequire } from 'module';\n`
  importPages += `const require = createRequire(import.meta.url);\n`
  importPages += `require('svelte/register');\n`;
  pagePaths.forEach((path, i) => {
    importPages += `delete require.cache['${path}'];\n`
    importPages += `const page_${i} = require('${path}');\n`;
  }); 
  importPages += 'export const pages = {\n';
  pagePaths.forEach((path, i) => {
    importPages += `  '${path}': page_${i},\n`;
  })
  importPages += '}\n';
  return await fs.outputFile(`${cayoPath}/generated/pages.js`, importPages);
}

export async function createTemplateManifest(projcetRoot, cayoPath) {
  let importTemplate = `import { createRequire } from 'module';\n`
  importTemplate += `const require = createRequire(import.meta.url);\n`
  importTemplate += `require('svelte/register');\n`
  importTemplate += `export const Template = require('${projcetRoot}/src/__index.svelte').default;\n`;
  // export { default as Template } from '${projcetRoot}/src/__index.svelte';
  return await fs.outputFile(`${cayoPath}/generated/template.js`, importTemplate);
}