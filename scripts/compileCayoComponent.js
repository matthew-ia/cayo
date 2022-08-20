import fs from 'fs-extra';
import { validateConfig, loadConfig } from '../lib/core/config.js';
import { build } from '../lib/core/bundle.js';
import { logger } from '../lib/core/logger.js';
import chalk from 'chalk';
import path from 'path';

// Initialzie Cayo Config
let cayoConfig;
try {
  cayoConfig = await validateConfig({});
  // cayoConfig = await loadConfig(options);
} catch (err) {
  logger.error(err);
  process.exit(1);
}
  
try {
  const source = path.resolve('./lib/components/Cayo.svelte');
  const output = path.resolve('./dist/cayo.svelte.js');
  const { js } = await build(source, cayoConfig);
  await fs.outputFile(output, js.code);
  console.log(chalk.green.bold('Compiled Cayo.svelte → cayo.svelte.js'));
  console.log(chalk.dim('./dist/cayo.svelte.js'));

} catch (err) {
  logger.error(new Error(`Cayo Internal Error: Could not compile: lib/components/Cayo.svelte\n`, {cause: err}));
}