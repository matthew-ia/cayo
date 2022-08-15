// import { default as fse } from 'fs-extra';
// import { promises as fs } from 'fs';
import { walk } from 'svelte/compiler';
import path from 'path';
import { hash } from '../utils.js';
import { getDeps } from '../bundle.js';

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
    default:
      type = 'components';
      if (dependencies.components[depender.path]) {
        for (const component of dependencies.components[depender.path]) {
          if (depender.path === component) {
            branch = [...branch, component];
          }
        }
      }
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
    if (dependency.endsWith('.svelte')) {
      // Check if each dependency in the tree has been compiled
      if (!stats.compiled.paths.has(dependency)) {
        // It hasn't been compiled yet, so compile it and handle it's dependencies
        const deps = (await getDeps(dependency, config))
        // Recursively handle nested dependencies
        await handleDependencies({ 
          path: dependency, 
          dependencies: deps 
        }, _cayo, config);
      }
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