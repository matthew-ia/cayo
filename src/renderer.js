
export class Renderer {

  constructor(templateHtml) {
    // this.pages = gatherPages();
    this.template = templateHtml;
  }

  render(pathname, page) {
    const { Component } = page;
    // if (!pathname.endsWith('/')) pathname = `${pathname}/`;
    const { html, css, head } = Component.render();
    // console.log(head);
    // console.log(css);

    // TODO: template function for page title
    const title = page.meta.title ? `${page.meta.title} — Cayo` : 'Cayo';
// <!--\sHTML_TAG_START\s-->
// <!--\sHTML_TAG_END\s-->
    const matches = html.matchAll(/<!--\s\%cayo.data:(.*)\%\s-->/g);
    const cayoData = {};

    let processedBody = html;

    for (const match of matches) {
      // console.log('match', match);
      const data = match[1];
      cayoData[data.cayoInstanceId] = data;

      // Remove cayo data comment from content
      processedBody = processedBody.replace(match[0], '');
    }

    let cayoDataHead = '';
    for (const dataId in cayoData) {
      const data = JSON.parse(cayoData[dataId]);
      cayoDataHead += 
        `<script daya-cayo-data-for="${data.cayoInstanceId}" type="application/json">`
        + cayoData[dataId]
        + '</script>\n'
    }

    let processedHead = cayoDataHead !== '' 
      ? head + '\n' + cayoDataHead
      : head;

    return {
      html: this.template
        .replace('%cayo.title%', !head.includes('<title>') ? `<title>${title}</title>` : '')
        .replace('%cayo.head%', processedHead)
        .replace('%cayo.body%', processedBody)
        .replace('%cayo.script%', `<script type="module" src="./index.js"></script>`),
      css: css,
    }
  }
}






// import App from '../src/app/App.svelte'

// async function main() {
//   const templatePath = join(process.cwd(), 'src', 'index.template')
//   const publicPath = join(process.cwd(), 'public')

//   const template = await fs.readFile(templatePath)
//   const app = App.render()

//   if (!existsSync(publicPath)) {
//     await fs.mkdir(publicPath)
//   }

//   await fs.writeFile(
//     join(publicPath, 'index.html'),
//     template.toString().replace('%svelte.head%', app.head).replace('%svelte.html%', app.html)
//   )
// }



