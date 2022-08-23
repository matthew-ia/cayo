// import { default as fse } from 'fs-extra';
// import { promises as fs } from 'fs';
import { walk } from 'svelte/compiler';
import path from 'path';
import { hash } from './utils.js';
import { getDeps } from './bundle.js';
import precinct from 'precinct';

/**
 * Adds dependencies to the dependency tree
 * 
 * @param {object} depender – a dependency branch (for a page or child component)
 * @param {object} dependencies – the dependency tree
 */
function addDependencies(depender, dependencies) {
  let type;
  let branch = [...depender.dependencies];

  // Update existing branches with these new deps where applicable
  for (const [key, page] of Object.entries(dependencies.pages)) {
    for (const component of dependencies.pages[key]) {
      if (depender.path === component && dependencies.components[component]) {
        dependencies.pages[key] = new Set([
          ...dependencies.pages[key], 
          ...dependencies.components[component]
        ]);
        depender.dependencies = [...dependencies.pages[key]];
      }
    }
  }

  switch (depender.type) {
    case 'page':
      type = 'pages';
      break;
    case 'component':
      type = 'components';
      break;
    case 'entry':
      type = 'entries';
      break;
    case 'asset':
    default:
      type = 'assets';
      break;
  }

  dependencies[type][depender.path] = new Set([...branch]);
}

/**
 * Recursively handles component deps, 
 * updates the depedendency tree, 
 * and updates the list of compiled components
 * 
 * @param {object} depender a dependency branch (for a page or child component)
 * @param {object} stats information about all dependers, their dependencies,
 *                         and what components have been compiled this run
 * @param {object} config cayo config
 */
export async function handleDependencies(depender, _cayo) {
  const { stats, config } = _cayo;

  // Add the depender to the dependency tree
  const branch = addDependencies(depender, stats.dependencies);
  // Add the depender to the list of compiled dependencies
  stats.compiled.paths.add(depender.path);

  // Iterate over the dependency tree
  for (const dependency of depender.dependencies) {
    let type;
    if (dependency.endsWith('.svelte')) {
      type = 'component';
    } else if (dependency.endsWith('.js')) {
      type = 'asset';
    } else {
      // Return early if it's not a file we can handle
      return branch;
    }

    if (!stats.compiled.paths.has(dependency)) {
      const deps = (await getDeps(dependency, config));
      // Recursively handle nested dependencies
      await handleDependencies({ 
        type,
        path: dependency, 
        dependencies: deps 
      }, _cayo, config);
    }
  }

  return branch;
}

export function findDependentPages(dependency, _cayo) {
  const { components, pages } = _cayo.stats.dependencies;
  const dependentComponents = new Set([dependency]);
  const dependentPages = new Set();

  // Lookup dependency in other components
  for (const [depender, deps] of Object.entries(components)) {
    if (deps.has(dependency)) {
      dependentComponents.add(depender);
    }
  }

  // Lookup any dependent components in pages
  for (const [depender, deps] of Object.entries(pages)) {
    for (const component of dependentComponents) {
      if (deps.has(component)) {
        dependentPages.add(depender)
      }
    }
  }

  return dependentPages;
}

export function findDependentCayos(pageDependency, _cayo) {
  const { components, pages } = _cayo.stats.dependencies;
  const dependentComponents = new Set([]);
  const cayos = new Set([]);

  // Lookup dependency in the page
  for (const dep of pages[pageDependency]) {
    if (dep.endsWith('.cayo.svelte')) cayos.add(dep);
    else if (dep.endsWith('.svelte')) dependentComponents.add(dep);    
  }

  // Lookup dependency in components that the page is dependent on
  for (const component of dependentComponents) {
    for (const dep of components[component]) {
      if (dep.endsWith('.cayo.svelte')) {
        cayos.add(dep);
      }
    }
  }

  return cayos;
}

export async function getEntryDependencies(entry, page, _cayo) {
  const { config } = _cayo;
  let imports = precinct(entry.code, { type: 'es6' });
  // Filter out public path ('/') and node_modules ('<package>')
  let localDeps = imports.filter(d => d.startsWith('../') || d.startsWith('./'));
  let absoluteDeps = localDeps.map(d => path.resolve(path.dirname(entry.path), d));
  let srcRelativeLocalDeps = localDeps.map((d, i) => {
    let pageCayoPath = path.resolve(config.cayoPath, page.url === '/' ? './' : page.url);
    return path.relative(pageCayoPath, absoluteDeps[i]);
  });
  // let nodeModules = imports
  //   .filter(d => !d.startsWith('../') && !d.startsWith('./') && !d.startsWith('/'))
  //   .map(d => path.relative(config.cayoPath, `${config.projectRoot}/node_modules/${d}`));
  
  entry.dependencies = [];
  for (let i = 0; i < localDeps.length; i++) {
    entry.dependencies.push([localDeps[i], srcRelativeLocalDeps[i]]);
  }


  const depender = { 
    type: 'entry', 
    path: entry.path, 
    dependencies: absoluteDeps, 
  }
  await handleDependencies(depender, _cayo);
}