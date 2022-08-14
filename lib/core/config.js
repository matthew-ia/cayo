import path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import { normalizePath } from './utils.js';
import { default as viteConfig } from './vite.config.js';
import chalk from 'chalk';
import merge from 'deepmerge';
import { logger } from './logger.js';

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
    components: z
      .string()
      .optional()
      .default('./src/components')
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
    debug: z
      .boolean()
      .optional()
      .default(false),
  });

  return await ConfigSchema.strict().parseAsync(userConfig);
}

export function checkConfigPaths(config) {
  const log = (option, value, hint) => {
    throw new Error (
      `Config Error: ${option}: '${value}' does not exist.` + (hint ? chalk.red(`\nHint: ${hint}`) : '')
    );
  }

  if (!fs.existsSync(config.projectRoot)) {
    log('config.projectRoot', config.projectRoot);
  }
  if (!fs.existsSync(path.resolve(config.projectRoot, config.src))) {
    log('config.src', config.projectRoot);
  }
  if (!fs.existsSync(path.resolve(config.projectRoot, config.pages))) {
    log('config.pages', config.pages);  
  }
  if (!fs.existsSync(path.resolve(config.projectRoot, config.components))) {
    log('config.components', config.components);  
  }
  if (!fs.existsSync(path.resolve(config.projectRoot, config.publicDir))) {
    log('config.publicDir', config.publicDir);  
  }
  if (!fs.existsSync(path.resolve(config.src, `${config.templateName}.svelte`))) {
    log('config.templateName', `${config.templateName}(.svelte)`, 
      'Check that your template file is properly named.'
    );
  }
  if (!fs.existsSync(path.resolve(config.projectRoot, config.publicDir))) {
    log('config.publicDir', config.publicDir);  
  }
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


  let config = null;
  try {
    config = await validateConfig(userConfig, root);
  } catch (err) {
    let msg = `User config file has issues (${err.issues.length})`;

    for (const e of err.issues) {
      if (e.code === 'invalid_type') {
        let option = e.path.join('.');
        msg += `\n> ${option}: expected type '${e.expected}' but received '${e.received}'.`
        throwError = true;
        console.log('invalid_ttype');

      } else if (e.code === 'unrecognized_keys') {
        for (let i = 0; i < e.keys.length; i++) {
          msg += `\n> Unrecognized key: ${e.keys[i]}`;
        }
      } else {
        msg += `\n> ${e.message}`;
      }
    }

    throw new Error(msg);
  }

  if (config && config.viteConfig) {
    const mergedViteConfig = merge(viteConfig, config.viteConfig, { arrayMerge: combineMerge });
    config.viteConfig = mergedViteConfig;
  }  
  
  return config;
}

// Credit: https://github.com/TehShrike/deepmerge#arraymerge-example-combine-arrays
function combineMerge(target, source, options) {
	const destination = target.slice();

	source.forEach((item, index) => {
		if (typeof destination[index] === 'undefined') {
			destination[index] = options.cloneUnlessOtherwiseSpecified(item, options);
		} else if (options.isMergeableObject(item)) {
			destination[index] = merge(target[index], item, options);
		} else if (target.indexOf(item) === -1) {
			destination.push(item);
		}
	});

	return destination;
}