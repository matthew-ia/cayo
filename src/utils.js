// import modules from '../.cayo/prerender/getPagesUtility.js';
// console.log(modules);
import klaw from 'klaw';

export async function getPages(ext, path) {
  // TODO: build path from config

  const filePaths = [] // files, directories, symlinks, etc
  const modules = [];
  // klaw(`${path}/src/pages`)
  //   .on('data', file => filePaths.push(file.path))
  //   .on('end', () => {
  //     console.log('end', filePaths);
  //   })
  for await (const file of klaw(`${path}/src/pages`)) {
    if (file.path.includes('.svelte')) {
      console.log(file.path);
      // let pageModule = ;
      modules.push(await import(file.path));
      console.log('pageModule', pageModule);
    }
  } 
  // for (let p of filePaths) {
    
  // }

  // const modules = import.meta.globEager(`/src/pages/**/*.svelte`);
  // const modules = import.meta.globEager(`/Users/matthewia/cayo/test/src/pages/**/*.svelte`);
  // TODO: make dynamically build from ext by adding \. to each and delimiting with |
  const extRegex = new RegExp(String.raw`(\.${ext})$`);

  return Object.entries(modules).reduce((pages, [modulePath, page]) => {
    // Make these paths actually useful
    const filePath = modulePath.replace(/^\.\/pages/, '').replace(extRegex, '')
    const urlPath = filePath.endsWith('/index') ? filePath.replace(/index$/, '') : `${filePath}/`
    let [name] = modulePath.split('/').slice(-1)
    name = name.split('.', 1)[0];
    pages[urlPath] = {
      name,
      Component: page.default,
      meta: page.meta ? page.meta : {},
      filePath,
      modulePath,
      urlPath
    }
    return pages
  }, {})
}

async function findPages(pages) {

  for (let p of pages) {

  }
}