import fs from 'fs-extra';
import fg from 'fast-glob';
import crypto from 'crypto';
import chalk from 'chalk';
import path from 'path';

// TODO: remove unused code

export function getPageModules(modules, config) {
  // TODO: build path from config
  const extRegex = new RegExp(String.raw`(\.svelte)$`);

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

export function getComponentModules(modules, config) {

  return Object.entries(modules).reduce((components, [modulePath, component]) => {
    const componentNameRegex = /\/(?<name>\w+)\.cayo\.svelte/; // Foo-{hash}
    const name = modulePath.match(componentNameRegex).groups.name;
    if (components[name]) {
      config.logger.info(
        chalk.red(
          `Cayo component with name '${name}' already exists. Cayo components must have unique file names.`
        ) + chalk.dim(`\n\t\t\t${modulePath}`), 
        { timestamp: true, clear: true, }
      );
    }
    components[name] = {
      Component: component.default,
      modulePath,
    }
    return components;
  }, {})
}

// https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/utils/hash.ts
export function hash(str = '', bytes = 5) {
  const random = crypto.randomBytes(bytes).toString('hex');
  str += random;
  
  str = str.replace(/\r/g, '');
  let hash = 5381;
  let i = str.length;

  while (i--) hash = ((hash << bytes) - hash) ^ str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

export function generateCayoComponentId(componentPath) {
  const name = componentPath
    .replace('./', '')
    .replace('/', '__')
    .replace('-', '_')
    .replace('.cayo.svelte', '')
  
  const id = `${name}-${hash(name)}`;

  return {
    id,
    name,
  };
}

export async function getPageModulePaths(pagesPath) {
  return await fg([path.resolve(pagesPath, './**/*.svelte')]);
}

export async function getComponentModulePaths(srcPath) {
  return await fg([path.resolve(srcPath, './components/**/*.cayo.svelte')]);
}

export async function createPageManifest(pagesPath, outDir, srcPath) {
  const pagePaths = await getPageModulePaths(pagesPath);
  const componentPaths = await fg([path.resolve(srcPath, './components/**/*.svelte')]);
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

  componentPaths.forEach((path) => {
    importPages += `delete require.cache['${path}'];\n`;
  });
  
  return await fs.outputFile(path.resolve(outDir, './__cayo/pages.js'), importPages);
}

export async function createComponentManifest(srcPath, outDir) {
  const componentPaths = await getComponentModulePaths(srcPath);
  let importComponents = `import { createRequire } from 'module';\n`;
  importComponents += `const require = createRequire(import.meta.url);\n`;
  importComponents += `require('svelte/register');\n`;
  componentPaths.forEach((path, i) => {
    importComponents += `delete require.cache['${path}'];\n`;
    importComponents += `const component_${i} = require('${path}');\n`;
  }); 
  importComponents += 'export const components = {\n';
  componentPaths.forEach((path, i) => {
    importComponents += `  '${path}': component_${i},\n`;
  })
  importComponents += '}\n';
  return await fs.outputFile(path.resolve(outDir, './__cayo/components.js'), importComponents);
}


export async function createTemplateManifest(templatePath, outDir) {
  let importTemplate = `import { createRequire } from 'module';\n`;
  importTemplate += `const require = createRequire(import.meta.url);\n`;
  importTemplate += `require('svelte/register');\n`;
  importTemplate += `delete require.cache['${templatePath}'];\n`;
  importTemplate += `export const Template = require('${templatePath}').default;\n`;
  return await fs.outputFile(path.resolve(outDir, './__cayo/template.js'), importTemplate);
}

export function getComponentDependencies(included) {
  const dependencies = [];
  included.forEach(filePath => {
    if (filePath.endsWith('.svelte')) {
      let name = filePath.split('/').pop();
      dependencies.push({ path: filePath, name });
    }
  });

  return dependencies;
}

// Credit: https://github.com/snowpackjs/astro
/** Add / to the end of string (but don’t double-up) */
export function addTrailingSlash(_path) {
  return _path.replace(/\/?$/, '/');
}

export function normalizePath(root, _path) {
  if (root === _path) return root;
  return path.normalize(path.join(root, addTrailingSlash(_path)));
}

export function getOutDir(config) {
  return config.mode === 'production' ? config.buildOptions.outDir : config.cayoPath;
}

export function getrootRelativeCayoComponentPath(srcPath, componentSrc) {
  // cayo: ./Test.cayo.svelte
  // ref:  <root>/components/Test.svelte
  //       -> <root>/components/
  //  -> <root>/components/

  let srcDir = path.resolve(srcPath, '..');

  let rootRelative = path.resolve(srcDir, componentSrc);
}