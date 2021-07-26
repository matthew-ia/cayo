export function getPages(ext) {
  // TODO: build path from config
  const modules = import.meta.globEager(`../../src/pages/**/*.svelte`);
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