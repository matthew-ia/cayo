#!/usr/bin/env node

// Build
//   - Compile Svelte components to JS
//   - Generate an index file for these components to be 
//     used as the Cayo package's exports

import fs from 'fs-extra';
import { validateConfig } from '../lib/core/config.js';
import { build } from '../lib/core/bundle.js';
import logger from '../lib/core/logger.js';
import chalk from 'chalk';
import path from 'path';

async function compileComponents(components, config) {
  const output = {};
  for (const component of components) {
    try {
      const inputPath = path.resolve(`./src/${component}.svelte`);
      const outputPath = path.resolve(`./dist/${component}.svelte.js`);
      const { js } = await build(inputPath, config);
      await fs.outputFile(outputPath, js.code);
      output[component] = { path: `./${component}.svelte.js` }
      console.log(chalk.green.bold(`Compiled ${component}.svelte → ${component}.svelte.js`));
      console.log(chalk.dim(`./dist/${component}.svelte.js`));
      
      // Copy type definition file
      const typeDefPath = path.resolve(`./src/${component}.svelte.d.ts`);
      const typeDefOutputPath = path.resolve(`./dist/${component}.svelte.d.ts`);
      if (await fs.pathExists(typeDefPath)) {
        await fs.copy(typeDefPath, typeDefOutputPath);
        console.log(chalk.cyan(`Copied ${component}.svelte.d.ts`));
      }
    } catch (err) {
      throw new Error(`Cayo Internal Error: Could not compile ./src/${component}.svelte`, { cause: err });
    }
  }

  return output;
}

function generateIndex(modules) {
  let js = '';
  for (const m of modules) {
    js += `export { default as ${m[0]} } from '${m[1]}';\n`;
  }
  // Add preprocessor exports
  js += `export { cayoPreprocess } from './preprocessors/index.js';\n`;
  return { code: js };
}

function generateIndexTypes(modules) {
  let dts = '';
  for (const m of modules) {
    dts += `export { default as ${m[0]} } from '${m[1]}';\n`;
  }
  // Add preprocessor type exports
  dts += `export { cayoPreprocess } from './preprocessors/index';\n`;
  return { code: dts };
}

try {
  const cayoConfig = await validateConfig({});
  const output = await compileComponents(['cayo', 'entry'], cayoConfig);
  const index = generateIndex([
    // Tuples of modules to import in the index file
    ['Cayo', output.cayo.path],
    ['Entry', output.entry.path],
  ]);
  await fs.outputFile('./dist/index.js', index.code);
  
  // Generate TypeScript definitions
  const indexTypes = generateIndexTypes([
    ['Cayo', './cayo.svelte'],
    ['Entry', './entry.svelte'],
  ]);
  await fs.outputFile('./dist/index.d.ts', indexTypes.code);
  
  // Copy preprocessors directory
  const preprocessorsPath = path.resolve('./src/preprocessors');
  const preprocessorsOutputPath = path.resolve('./dist/preprocessors');
  if (await fs.pathExists(preprocessorsPath)) {
    await fs.copy(preprocessorsPath, preprocessorsOutputPath);
    console.log(chalk.cyan(`Copied preprocessors/`));
  }
  
  console.log(chalk.green.bold(`✅ Components built.`));
  console.log(chalk.dim(`./dist/index.js`));
  console.log(chalk.dim(`./dist/index.d.ts`));

} catch (err) {
  logger.error(err);
  console.error(err.stack);
  process.exit(1);
}