import path from 'path';
import { existsSync } from 'fs';

/** Set default config values */
async function configDefaults(userConfig) {
  const config = { ...(userConfig || {}) };

  if (!config.projectRoot) config.projectRoot = '.';
  if (!config.src) config.src = './src';
  if (!config.pages) config.pages = './src/pages';
  if (!config.dist) config.dist = './dist';
  if (!config.public) config.public = './public';

  return config;
}

/** Turn raw config values into normalized values */
function normalizeConfig(userConfig, root) {
  const config = { ...(userConfig || {}) };

  const fileProtocolRoot = `file://${root}/`;
  config.projectRoot = new URL(config.projectRoot + '/', fileProtocolRoot);
  config.src = new URL(config.src + '/', fileProtocolRoot);
  config.pages = new URL(config.pages + '/', fileProtocolRoot);
  config.public = new URL(config.public + '/', fileProtocolRoot);

  return config;
}

export async function loadConfig(root, configFileName) {
  // TODO: root necessary?
  // const root = root ? path.resolve(root) : process.cwd();
  const configPath = new URL(`./${configFileName}`, `file://${root}/`);

  // load config
  let config;
  if (existsSync(configPath)) {
    // from user config file
    config = await configDefaults((await import(astroConfigPath.href)).default);
  } else {
    // default config fallback
    config = await configDefaults();
  }

  // validate
  validateConfig(config);

  // normalize (paths)
  config = normalizeConfig(config, root);
}