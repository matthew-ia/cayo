// import modules from '../.cayo/prerender/getPagesUtility.js';
// console.log(modules);
// import klaw from 'klaw';
// import { pages as _pages } from '../.cayo/generated/pages.js';

export function getPages(ext, _pages = _pages) {
  // TODO: build path from config

  // const modules = import.meta.globEager(`/src/pages/**/*.svelte`);
  // const modules = import.meta.globEager(`/Users/matthewia/cayo/test/src/pages/**/*.svelte`);
  const extRegex = new RegExp(String.raw`(\.${ext})$`);

  return Object.entries(_pages).reduce((pages, [modulePath, page]) => {
    // Make these paths actually useful
    // /^(.+)\/pages/
    // /^(\/\w+)*\/pages/
    const filePath = modulePath.replace(/^(.+)\/pages/, '').replace(extRegex, '')
    const urlPath = filePath === '/index' 
      ? filePath.replace(/index$/, '') 
      : `${filePath}/`
      // : filePath[0] !== '/' 
      //   ? `/${filePath}/`
      //   : `${filePath}/`;
      
    console.log('> getPages.urlPath', urlPath);
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

export function getDistPath() {
  // TODO: write function that returns built dist path based on env and config root path
}