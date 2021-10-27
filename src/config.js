import path from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { normalizePath } from './utils.js';
import { default as viteConfig } from './vite.config.js';

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
    buildOptions: z
      .object({
        outDir: z
          .string()
          .optional()
          .default('./dist')
          .transform(val => normalizePath(base, val)),
        assetsDir: z
          .string()
          // .or(z.boolean())
          .optional()
          .default('.')
          // TODO: This may cause bugs if user passes boolean, idk tho
          .transform(val => normalizePath(base, val)),
        legacy: z.
          boolean()
          .optional()
          .default(false)
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
      .any({})
      .default(viteConfig),
    cayoPath: z
      .string()
      .optional()
      .default('.cayo/')
      .transform(val => normalizePath(base, val)),
    cayoComponentInfix: z
      .string()
      .optional()
      .default('cayo'),
    mode: z
      .string()
      .optional()
      .default('development'),
  });

  return await ConfigSchema.parseAsync(userConfig);

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
  if (existsSync(configPath)) {
    userConfig = { 
      ...(await import(configPath)).default,
      ...userConfig,
    };
    // console.log('userConfig', userConfig);
  }
  return validateConfig(userConfig, root);
}