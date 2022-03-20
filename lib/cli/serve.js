import { createServer } from "vite";
import merge from 'deepmerge';

export async function serve(config) {

  const serveConfig = {
    root: config.cayoPath, 
    publicDir: config.publicDir,
    mode: config.mode,
    base: config.base,
    configFile: false,
  } 

  // const mergedConfig = merge(config.viteConfig, serveConfig);
  
  const server = await createServer({
    ...merge(config.viteConfig, serveConfig),
  })

  await server.listen()
}