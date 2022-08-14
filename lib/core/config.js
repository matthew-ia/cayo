import path from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import { normalizePath } from './utils.js';
import { default as viteConfig } from './vite.config.js';
import chalk from 'chalk';
import merge from 'deepmerge';
import { logger } from './logger.js';


async function checkConfigPath(key, defaultValue, val, ctx) {
  if (!await fs.pathExists(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: '',
      params: {
        isBadPath: true,
        key,
        val,
        default: defaultValue,
      }
    })
  }
}

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
      .transform(val => normalizePath(base, val))
      .superRefine(async (val, ctx) => await checkConfigPath('src', './src', val, ctx)),
    pages: z
      .string()
      .optional()
      .default('./src/pages')
      .transform(val => normalizePath(base, val))
      .superRefine(async (val, ctx) => await checkConfigPath('pages', './src/pages', val, ctx)),
    components: z
      .string()
      .optional()
      .default('./src/components')
      .transform(val => normalizePath(base, val))
      .superRefine(async (val, ctx) => await checkConfigPath('components', './src/components', val, ctx)),
    publicDir: z
      .string()
      .optional()
      .default('./public')
      .transform(val => normalizePath(base, val))
      .superRefine(async (val, ctx) => await checkConfigPath('publicDir', './public', val, ctx)),
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
      .transform(val => normalizePath(base, val))
      .superRefine(async (val, ctx) => await checkConfigPath('cayoPath', '.cayo/', val, ctx)),
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

// Check parsed config
export function checkParsedConfig(config) {
  const log = (key, value, hint) => {
    let msg = 'User config file has an issue.';
    msg += `\n> ${key}: '${value}' does not exist at the root of the pages path.` + (hint ? chalk.red(`\n  Hint: ${hint}`) : '');
    throw new Error (msg);
  }

  if (!fs.existsSync(path.resolve(config.src, `${config.templateName}.svelte`))) {
    log('templateName', `${config.templateName}(.svelte)`, 
      'Check that your template file is properly named.'
    );
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
    let msg = `User config file has issues.`;

    // TODO: break this stuff out into another function and clean it up
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
      } else if (e.code === 'custom') {
        if (e.params.isBadPath) {
          let option = userConfig;
          for (const key of e.path) {
            if (option[key]) {
              option = option[key];
            } else {
              option = null;
              break;
            }
          }
          if (!option) msg = `Project setup has issues. Check that your paths match the expected defaults, or that path changes are reflected in your config.`;
          msg += `\n> ${e.params.key}: path does not exist: ${e.params.val}'.`;

          if (option) {
            if (e.params.key === 'src' || e.params.key === 'pages' || e.params.key === 'components' && 
              ( !userConfig.src || !userConfig.pages || !userConfig.components)
            ) {
              msg += `\n  'src', 'pages', and 'components' paths must be updated together, as each is relative to the project root path.`;
            }
          }
          if (!option) {
            msg += `\n  Default '${e.params.key}' value is ${e.params.default}`;
          }

        } else {
          msg += `\n> ${e.message}`;
        }
      } else {
        let option = e.path.join('.');
        msg += `\n> ${option}: ${e.message}`;
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