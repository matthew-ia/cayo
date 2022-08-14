import path, { normalize } from 'path';
import fs from 'fs-extra';
import { z } from 'zod';
import { normalizePath } from './utils.js';
import { default as viteConfig } from './vite.config.js';
import chalk from 'chalk';
import merge from 'deepmerge';

async function validateConfig(userConfig) {
  const ConfigSchema = z.object({
    projectRoot: z
      .string()
      .default('.'),
    src: z
      .string()
      .default('./src'),
    pages: z
      .string()
      .default('./pages'),
    components: z
      .string()
      .default('./components'),
    publicDir: z
      .string()
      .default('./public'),
    // TODO: make this an object with `value` and `mode` so it can be toggled per env if needed
    base: z
      .string()
      .optional(),
    build: z
      .object({
        outDir: z
          .string()
          .default('./dist'),
        assetsDir: z
          .string()
          .default('assets'),
        legacy: z.
          boolean()
          .default(false),
      })
      .optional()
      .default({}),
    css: z
      .object({
        internal: z
          .boolean()
          .default(false),
      })
      .optional()
      .default({}),
    viteConfig: z
      .any({}),
      // .default(viteConfig),
    cayoPath: z
      .string()
      .default('.cayo/'),
    cayoComponentInfix: z
      .string()
      .default('cayo'),
    templateName: z
      .string()
      .default('__template'),
    mode: z
      .string()
      .default('development'),
    debug: z
      .boolean()
      .default(false),
  });

  return await ConfigSchema.strict().parseAsync(userConfig);
}

async function handlePaths(config, input, base) {
  // Build paths from the config options
  let projectRoot = normalizePath(base, config.projectRoot);
  let src = normalizePath(projectRoot, config.src);
  let pages = normalizePath(src, config.pages);
  let components = normalizePath(src, config.components);
  let publicDir = normalizePath(projectRoot, config.publicDir);

  // Handle the template path a little differently below, since the option is a name not a path
  let templateName = config.templateName;
  let templatePath = path.join(src, `${templateName}.svelte`);

  // Validate the built paths
  let errorMessage = '';
  let isError = false;
  let isInvalidInput = false;
  const paths = { projectRoot, src, pages, components, templatePath, publicDir };
  for (const [key,  value] of Object.entries(paths)) {
    if (!(await fs.pathExists(value))) {
      if (!input[key] && key !== 'templatePath') {
        errorMessage += `\n\n> Expected '${key}' path does not exist: ${value}`;
      } else {
        switch(key) {
          case 'templatePath':
            errorMessage += `\n\n> 'templateName': ${templateName} (.svelte) not found at root of 'src' path.`;
            errorMessage += `\n  Expected template path does not exist: ${templatePath}`;
            break;
          default:
            errorMessage += `\n\n> ${key}: realtive path does not exist: ${input[key]}`
            errorMessage += `\n  Expected '${key}' path does not exist: ${value}`;
            isInvalidInput = true;
        }
      }
      isError = true;
    }
  }

  if (!isError) {
    // Update the config to use the validated absolute path values
    config.projectRoot = projectRoot;
    config.src = src;
    config.pages = pages;
    config.components = components;
    config.template = templatePath;
    config.publicDir = publicDir;
  } else {
    if (isInvalidInput) errorMessage = 'Config includes an invalid path.' + errorMessage;
    else errorMessage = `Project structure is invalid.` + errorMessage;
    throw new Error(errorMessage);
  }
}

function handleZodError(error) {
  let msg = 'Config is invalid.';
  for (const e of error.issues) {
    msg += `\n\n> ${e.message}`; 
  }
  throw new Error(msg);
}

export async function loadConfig(options) {
  const configFileName = 'cayo.config.js';

  // Use command-line options if user passes them
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
    config = await validateConfig(userConfig);
    await handlePaths(config, userConfig, root);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw handleZodError(err);
    }
    throw err;
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