import fs from 'fs-extra';
import fg from 'fast-glob';
import crypto from 'crypto';

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
    return pages;
  }, {})
}

export async function getComponentModules(projectRoot) {
  const componentPaths = await getComponentModulePaths(projectRoot);
  const componentNameRegex = /\/(?<name>\w+)\.svelte/; // Foo-{hash}
  const componentNamesFromPaths = componentPaths.map(filePath => 
    filePath.match(componentNameRegex).groups.name
  );
  // componentNamesFromPaths.forEach((name, i) => components[name].modulePath = componentPaths[i]);
  return componentNamesFromPaths.reduce((components, name, i) => {
    return components[name] = {
      modulePath: componentPaths[i]
    }
  }, {});
}

export function hash(bytes = 5) {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function getPageModulePaths(projectRoot) {
  return await fg([`${projectRoot}/src/pages/**/*.svelte`]);
}

export async function getComponentModulePaths(projectRoot) {
  return await fg([`${projectRoot}/src/components/**/*.svelte`]);
}

export async function createPageManifest(projectRoot, cayoPath) {
  const pagePaths = await getPageModulePaths(projectRoot);
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

export async function createTemplateManifest(projectRoot, cayoPath) {
  let importTemplate = `import { createRequire } from 'module';\n`
  importTemplate += `const require = createRequire(import.meta.url);\n`
  importTemplate += `require('svelte/register');\n`
  importTemplate += `export const Template = require('${projectRoot}/src/__index.svelte').default;\n`;
  // export { default as Template } from '${projectRoot}/src/__index.svelte';
  return await fs.outputFile(`${cayoPath}/generated/template.js`, importTemplate);
}
