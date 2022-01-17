import path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import { normalizePath } from './utils.js';
import { default as viteConfig } from './vite.config.js';
import chalk from 'chalk';
import merge from 'deepmerge';

async function validateConfig(userConfig, base) {
  const ConfigSchema = z.object({
    projectRoot: z
      .string()
      .optional()
      .default('.')
      .transform(val => normalizePath(base, val)),
    src: z
      .string()
      .optional()
      .default('./src')
      .transform(val => normalizePath(base, val)),
    pages: z
      .string()
      .optional()
      .default('./src/pages')
      .transform(val => normalizePath(base, val)),
    publicDir: z
      .string()
      .optional()
      .default('./public')
      .transform(val => normalizePath(base, val)),
    base: z
      .string()
      .optional(),
    build: z
      .object({
        outDir: z
          .string()
          .optional()
          .default('./dist')
          .transform(val => normalizePath(base, val)),
        assetsDir: z
          .string()
          .optional()
          .default('assets'),
          // .transform(val => normalizePath(base, val)),
        legacy: z.
          boolean()
          .optional()
          .default(false),
      })
      .optional()
      .default({}),
    css: z
      .object({
        internal: z
          .boolean()
          .optional()
          .default(false),
      })
      .optional()
      .default({}),
    viteConfig: z
      .any({}),
      // .default(viteConfig),
    cayoPath: z
      .string()
      .optional()
      .default('.cayo/')
      .transform(val => normalizePath(base, val)),
    cayoComponentInfix: z
      .string()
      .optional()
      .default('cayo'),
    templateName: z
      .string()
      .default('__layout'),
    mode: z
      .string()
      .optional()
      .default('development'),
  });

  return await ConfigSchema.parseAsync(userConfig);
}

export function checkConfigPaths(config, logger) {
  let errorLogged = false;
  const log = (option, value) => {
    logger.warn(
      chalk.red(`Config Error: ${option}: '${value}' does not exist`),
      { timestamp: true, clear: false, }
    );
    errorLogged = true;
  }
  if (!fs.existsSync(config.projectRoot)) 
    log('config.projectRoot', config.projectRoot);
  if (!fs.existsSync(path.resolve(config.projectRoot, config.src))) 
    log('config.src', config.projectRoot);
  if (!fs.existsSync(path.resolve(config.projectRoot, config.pages))) 
    log('config.pages', config.pages);  
  if (!fs.existsSync(path.resolve(config.projectRoot, config.publicDir))) 
    log('config.publicDir', config.publicDir);  
  if (!fs.existsSync(path.resolve(config.src, `${config.templateFileName}.svelte`))) 
    log('config.templateFileName', `${config.templateFileName}(.svelte)`);
  if (!fs.existsSync(path.resolve(config.projectRoot, config.publicDir))) 
    log('config.publicDir', config.publicDir);  

  if(errorLogged) throw new Error('Config Error: fix the issues above in your config file');
}

export async function loadConfig(options) {
  const configFileName = 'cayo.config.js';

  // Use options passed to the CLI for projectRoot and configPath
  const root = options.projectRoot 
    ? path.resolve(options.projectRoot) 
    : process.cwd();

  const configPath = options.configPath 
    ? path.resolve(root, options.configPath)
    : path.resolve(root, `./${configFileName}`);

  // Load config from user config file
  let userConfig = { projectRoot: root, mode: options.mode };
  if (fs.existsSync(configPath)) {
    userConfig = { 
      ...(await import(configPath)).default,
      ...userConfig,
    };
  }

  const config = await validateConfig(userConfig, root);
  if (config.viteConfig) {
    const mergedViteConfig = merge(viteConfig, config.viteConfig, { arrayMerge: combineMerge });
    config.viteConfig = mergedViteConfig;
  }
  
  return config;
}

// Credit: https://github.com/TehShrike/deepmerge#arraymerge-example-combine-arrays
function combineMerge(target, source, options) {
	const destination = target.slice()

	source.forEach((item, index) => {
		if (typeof destination[index] === 'undefined') {
			destination[index] = options.cloneUnlessOtherwiseSpecified(item, options)
		} else if (options.isMergeableObject(item)) {
			destination[index] = merge(target[index], item, options)
		} else if (target.indexOf(item) === -1) {
			destination.push(item)
		}
	})
	return destination
}