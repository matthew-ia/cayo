import fs from 'fs-extra';
import path from 'path';

import { handleDependencies } from '../dependencies.js';
import { Component } from '../component.js';
import { build } from '../bundle.js';
import logger from '../logger.js';

export async function compileCayos(components, _cayo) {
  const compiledComponents = [];

  if (components === null) {
    components = _cayo.stats.cayoComponents;
  }

  for (const [name, cayo] of Object.entries(components)) {
    if (!cayo.named && !fs.pathExistsSync(cayo.src)) {
      let relativeFilePath = cayo.src.replace(_cayo.config.projectRoot, '.');
      let errorMessage = `Could not compile cayo. Path does not exist: '${relativeFilePath}'`
      throw new Error(errorMessage);  
    } else {
      compiledComponents.push(
        await compileCayo(name, cayo, _cayo)
      );
    }
    
  }

  return compiledComponents;
}

export async function compileCayo(name, cayo, _cayo) {
  const { config } = _cayo;
  let filepath = cayo.src;

  // Named imports (e.g. `import { Counter } from 'pkg'`) have no single file entry.
  // Generate a synthetic module that re-exports the named component as default so
  // Rollup can compile it as a standard Svelte component entry.
  if (cayo.named) {
    const syntheticContent = `import { ${cayo.named} } from '${cayo.importSource}';\nexport default ${cayo.named};\n`;
    const syntheticPath = path.resolve(config.cayoPath, `./__cayo/components/${name}-entry.js`);
    await fs.outputFile(syntheticPath, syntheticContent);
    filepath = syntheticPath;
  }

  const { js, css, dependencies } = await build(filepath, config, 'cayo');
  
  const depender = { 
    type: 'component', 
    path: filepath, 
    dependencies,
  }
  
  try {
    await handleDependencies(depender, _cayo);
    
    // Write bundle to a file
    let outputPath = path.resolve(
      config.cayoPath, 
      `./__cayo/components/${name}.svelte.js`
    );

    await fs.outputFile(outputPath, js.code);

    // Create new Component and add it to the runtime object
    const cayo = new Component(name, { js, css }, filepath, outputPath, dependencies, config);
    _cayo.components.set(filepath, cayo);

    return cayo;

  } catch (err) {
    const importSource = cayo.importSource ?? filepath;
    throw new Error(`Compiling Cayo Component: ${importSource}\n`, {cause: err});
  }
}

