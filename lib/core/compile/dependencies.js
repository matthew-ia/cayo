// import { default as fse } from 'fs-extra';
// import { promises as fs } from 'fs';
import { walk } from 'svelte/compiler';
import path from 'path';
import precinct from 'precinct';
import { hash } from '../utils.js';
import { getDeps } from '../bundle.js';


export function resolveImports(code, filepath, config) {
  const absoluteBase = path.dirname(filepath);
  const { src: srcPath } = config;
  // NOTE: precinct doesn't work on Svelte code
  const imports = precinct(code);
  // if (filepath.endsWith('index.svelte')) console.log(imports);
  const deps = [];
  let newCode = code;
  for (const _path of imports) {
    // TODO: this won't get aliased stuff, but aliased paths should work anyway
    if (_path.startsWith('../') || _path.startsWith('./') || _path.startsWith('/')) {
      
      let resolved = path.resolve(absoluteBase, _path);
      let relative = resolved.replace(`${srcPath}`, '');
      let cayoPath = path.resolve(config.cayoPath, `./__cayo/${relative}`);
      
      console.log(_path);
      deps.push(resolved);
      
      if (_path.endsWith('.svelte')) {
        cayoPath = cayoPath.replace('.svelte', '.svelte.js');
        newCode = newCode.replace(_path, cayoPath);
      } else {
        newCode = newCode.replace(_path, resolved);
      }
      
    } else {
      // TODO: need to test this in an external test project
      // The idea is that we need to replace any references to the Cayo component internal
      // to the cayo package are replaced with the compiled version in .cayo.
      // 
      // if the original import technically isn't really used and just an trigger to ensure we
      // add the dependency, should the trigger be something else? like a prop? or some other Svelte thing?
      //   
      // Handle Cayo Component (this is for testing)
      let newPath = path.resolve(config.cayoPath, `./__cayo/cayo.svelte.js`);
      newCode = newCode
        .replace('#cayo/component', newPath)
        .replace('cayo/component', newPath);
    }
  }

  return { 
    code: newCode, 
    // dependencies: deps,
  };
}

export function resolveDependencies(rawCode, ast, filepath, stats, config) {
  const result = resolveImports(rawCode, filepath, config);
  const { source, cayoComponentPaths } = resolveCayoComponents(result.code, ast, filepath, stats, config);
  // console.log('result', result);
  // console.log('code', source);
  return {
    source,
    cayoComponentPaths: new Set([...cayoComponentPaths]),
  };
}


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
export async function handleDependencies(depender, _cayo, config) {
  const { stats } = _cayo;

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

export function resolveCayoComponents(code, ast, filepath, stats, config) {
  
  const absoluteBase = path.dirname(filepath);
  const cayoComponentPaths = [];
  const deps = [];
  const propName = 'src';
  // code;

  // TODO: better error reporting with the logger
  walk(ast.html, {
    enter(node, parent) {
      if (node.type === 'InlineComponent' && node.name === 'Cayo') {
        if (node.attributes) {
          const attribute = node.attributes.find(attribute => attribute.name === propName);
          if (attribute) {
            const value = attribute.value[0];
            const type = value.type;
            if (type === 'Text') {
              cayoComponentPaths.push(value.data);
            } else if (type === 'MustacheTag') {
              if (value.expression.type === 'Literal') {
                cayoComponentPaths.push(value.expression.value);
              } else {
                console.warn(`Cayo component instances requires the '${propName}' prop to be a string, but was ${attribute.value[0].expression}`);
              }
            } 
          } else {
            console.warn(`Cayo component instance without a '${propName}' prop value found`);
          } 
        } 
      }
    }
  });


  // TODO: consider just precompiling cayo.svelte.js so the import actually works just fine
  // let cayoComponent = path.resolve(config.cayoPath, `./__cayo/cayo.svelte.js`);
  // code = code
  //   .replace('#cayo/component', cayoComponent)
  //   .replace('cayo/component', cayoComponent);

  for (const _path of cayoComponentPaths) {
    // TODO: this won't get aliased stuff, but aliased paths should work anyway
    if (_path.startsWith('../') || _path.startsWith('./') || _path.startsWith('/')) {
      let resolved = path.resolve(absoluteBase, _path);
      let relative = resolved.replace(`${config.components}`, '');
      deps.push(resolved);
      
      // FIXME: re: Cayo Component issue with prerendering
      let cayoComponentName = relative
      .replace('/', '__')
      .replace('-', '_')
      .replace('.cayo.svelte', '');

      stats.cayoComponents[cayoComponentName]= {
        source: resolved,
        compiled: path.resolve(
          config.cayoPath, 
          `./__cayo/components/${relative.replace('.svelte', '.svelte.js')}`
        ),
      }
      code = code.replace(_path, `${cayoComponentName}-${hash(cayoComponentName)}`);
    }
  }

  return { cayoComponentPaths: deps, source: code };
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