import path from 'path';
import { build as viteBuild } from 'vite';

export async function build(_cayo) {
  const { config } = _cayo;
  const root = config.cayoPath;
  const inputs = {};
  for (const [, page] of _cayo.pages) {
    let key = page.url;
    let source = `./${page.url}/index.html`
    if (page.url === '/') {
      key = 'index';
      source = './index.html'
    }
    
    inputs[key] = path.resolve(root, source);
  }
  
  return await viteBuild({
    root: config.cayoPath,
    base: config.base,
    publicDir: config.publicDir,
    build: {
      ...config.build,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          ...inputs,
        },
      }
    }
  })
}