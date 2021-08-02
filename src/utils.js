import crypto from 'crypto';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import fg from 'fast-glob';

export async function getPages(ext = 'svelte') {
  // TODO: build path from config
  const { pages: _pages } = await import('../.cayo/generated/pages.js');

  const extRegex = new RegExp(String.raw`(\.${ext})$`);

  return Object.entries(_pages).reduce((pages, [modulePath, page]) => {
    // Make these paths actually useful
    // /^(.+)\/pages/
    // /^(\/\w+)*\/pages/
    const filePath = modulePath.replace(/^(.+)\/pages\//, '').replace(extRegex, '')
    const urlPath = filePath === 'index' ? filePath.replace(/index$/, '/') : `${filePath}/`
    // name = name.split('.', 1)[0];
    pages[urlPath] = {
      Component: page.default,
      meta: page.meta ? page.meta : {},
      filePath,
      modulePath,
      urlPath
    }
    return pages
  }, {})
}

export async function viteBuildScript(moduleName) {
  const cmd = 'vite';
  const args = [
    'build', 
    // Path to prerender config
    // TODO: this should be contained somewhere other than root of this package I think
    '--config', './vite.prerender.config.js', 
    // Output directory
    '--outDir', 'dist', 
    // File to build (output is runnable in node env)
    '--ssr', `src/${moduleName}.js`
  ];
  
  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args, { shell: true, stdio: 'inherit' });
    // Resolve promise
    process.on('close', (code) => {
      resolve(code)
    });
    // Reject promise
    process.on('error', (err) => {
      reject(err)
    });
  });
}

export function hash(bytes = 5) {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function createPageImports(resolvedProjectRoot, dotPath) {
  const pagePaths = await fg([`${resolvedProjectRoot}/src/pages/**/*.svelte`]);
  let importPages = '';
  pagePaths.forEach((path, i) => {
    importPages += `import * as page_${i} from '${path}'\n`;
  }); 
  importPages += 'export const pages = {\n';
  pagePaths.forEach((path, i) => {
    importPages += `  '${path}': page_${i},\n`;
  })
  importPages += '}\n';
  return await fs.outputFile(`${dotPath}/generated/pages.js`, importPages);
}

export async function createTemplateImport(resolvedProjectRoot, dotPath) {
  let importTemplate = `export { default as Template } from '${resolvedProjectRoot}/src/__index.svelte';`;
  await fs.outputFile(`${dotPath}/generated/template.js`, importTemplate);
}