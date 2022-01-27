import fs from 'fs-extra';
import fg from 'fast-glob';
import crypto from 'crypto';
import chalk from 'chalk';
import path from 'path';
import precinct from 'precinct';

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

export function hash(bytes = 5) {
  return crypto.randomBytes(bytes).toString('hex');
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

export function resolveImports(code, filepath, config) {
  const absoluteBase = path.dirname(filepath);
  const { src: srcPath } = config;
  const imports = precinct(code);
  const deps = [];
  let newCode = code;
  for (const _path of imports) {
    // TODO: this won't get aliased stuff, but aliased paths should work anyway
    if (_path.startsWith('../') || _path.startsWith('./') || _path.startsWith('/')) {
      let resolved = path.resolve(absoluteBase, _path);
      let relative = resolved.replace(`${srcPath}`, '');
      let cayoPath = path.resolve(config.cayoPath, `./__cayo/${relative}`);

      deps.push(resolved);
      cayoPath = cayoPath.replace('.svelte', '.svelte.js');
      newCode = newCode.replace(_path, cayoPath);
    } else {
      let newPath = path.resolve(config.cayoPath, `./__cayo/cayo.svelte.js`);
      newCode = newCode
        .replace('#cayo/component', newPath)
        .replace('cayo/component', newPath);
    }
  }

  return { dependencies: deps, code: newCode };
}

function addDependencies(depender, dependencies) {
  if (!dependencies[depender.path] || dependencies[depender.path].length === 0) {
    dependencies[depender.path] = new Set(depender.dependencies);
  } else {
    for (const dependency of depender.dependencies) {
      dependencies[depender.path].add(dependency);
    }
    // dependencies[depender.path] = new Set([...dependencies[depender.path], ...depender.dependencies]);
  }
}

export async function handleDependencies(depender, stats, callback, config) {
  addDependencies(depender, stats.dependencies);
  stats.compiled.add(depender.path);

  for await (const dependency of depender.dependencies) {
    if (!stats.compiled.has(dependency)) {
      const result = (await callback([dependency], stats, config))[0];
      await handleDependencies({ 
        path: result.depender.path, 
        dependencies: result.depender.dependencies 
      }, stats, callback, config);
    }
  }
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