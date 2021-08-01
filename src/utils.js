// import modules from '../.cayo/prerender/getPagesUtility.js';
// console.log(modules);
import klaw from 'klaw';
import { pages as _pages } from '../.cayo/generated/pages.js';

export async function getPages(ext) {
  // TODO: build path from config

  // const modules = import.meta.globEager(`/src/pages/**/*.svelte`);
  // const modules = import.meta.globEager(`/Users/matthewia/cayo/test/src/pages/**/*.svelte`);
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