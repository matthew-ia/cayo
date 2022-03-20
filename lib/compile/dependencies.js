// import { default as fse } from 'fs-extra';
// import { promises as fs } from 'fs';
import path from 'path';
import precinct from 'precinct';


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

/**
 * Adds dependencies to the dependency tree
 * 
 * @param {object} depender – a dependency branch (for a page or child component)
 * @param {object} dependencies – the dependency tree
 */
function addDependencies(depender, dependencies) {
  if (!dependencies[depender.path] || dependencies[depender.path].length === 0) {
    dependencies[depender.path] = new Set(depender.dependencies);
  } else {
    for (const dependency of depender.dependencies) {
      dependencies[depender.path].add(dependency);
    }
  }
}

/**
 * Recursively handles component dependecies, 
 * updates the depedendency tree, 
 * and updates the list of compiled components
 * 
 * @param {object} depender – a dependency branch (for a page or child component)
 * @param {object} stats – information about all dependers, their dependencies,
 *                         and what components have been compiled this run
 * @param {function} handler – callback that should compile a dependency (component)
 * @param {object} config – cayo config
 */
export async function handleDependencies(depender, stats, handler, config) {
  // Add the depender to the dependency tree
  addDependencies(depender, stats.dependencies);
  // Add the depender to the list of compiled dependencies
  stats.compiled.add(depender.path);

  // Iterate over the dependency tree
  for await (const dependency of depender.dependencies) {
    // Check if each dependency in the tree has been compiled
    if (!stats.compiled.has(dependency)) {
      // It hasn't been compiled yet, so compile it and handle it's dependencies
      const result = (await handler([dependency], stats, config))[0];
      // Recursively handle nested dependencies
      await handleDependencies({ 
        path: result.depender.path, 
        dependencies: result.depender.dependencies 
      }, stats, handler, config);
    }
  }
}