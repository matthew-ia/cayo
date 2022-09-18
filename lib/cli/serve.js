import { createServer } from 'vite';
import merge from 'deepmerge';

export async function serve(config) {

  const serveConfig = {
    root: config.cayoPath, 
    publicDir: config.publicDir,
    mode: config.mode,
    base: config.base,
    configFile: false,
  }
  
  const server = await createServer({
    ...merge(config.vite, serveConfig),
  });

  await server.listen();
  server.printUrls();

  // logger.log.info(
  //   chalk.green('Server running at') + chalk.dim(`${page.name}`), 
  //   { timestamp: true }
  // );
}