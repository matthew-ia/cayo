import path from 'path';
import { existsSync } from 'fs';
import { z } from 'zod';
import { normalizePath } from './utils.js';




/** Turn raw config values into normalized values */
async function validateConfig(userConfig, base) {

  const ConfigSchema = z.object({
    root: z
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
          .or(z.boolean())
          .optional()
          .default('./assets')
          // TODO: This may cause bugs if user passes boolean, idk tho
          .transform(val => normalizePath(base, val)),
        legacy: z.
          boolean()
          .optional()
          .default(false)
      })
      .optional()
      .default({}),
    viteOptions: z
      .object()
      .optional()
      .default({})
  });

  return ConfigSchema.parseAsync(userConfig);

}

export async function loadConfig(base, configFileName = 'cayo.config.js') {
  // TODO: root necessary?
  // const root = root ? path.resolve(root) : process.cwd();
  // const configPath = new URL(`./${configFileName}`, `file://${root}/`);
  const configPath = path.resolve(base, `./${configFileName}`);

  // load config
  let userConfig;
  if (existsSync(configPath)) {
    // from user config file
    userConfig = await import(configPath).default;
  }

  return validateConfig(userConfig, base);
}