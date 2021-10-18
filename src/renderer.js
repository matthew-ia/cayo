
export class Renderer {

  constructor(templateHtml) {
    this.template = templateHtml;
  }

  render(page) {
    const { Component } = page;
    const { html, css, head } = Component.render();
    console.log(page);

    // TODO: template function for page title
    const title = page.meta.title ? `${page.meta.title} — Cayo` : 'Cayo';

    return {
      html: this.template
        .replace('%cayo.title%', !head.includes('<title>') ? `<title>${title}</title>` : '')
        .replace('%cayo.head%', head)
        .replace('%cayo.body%', html)
        .replace('%cayo.script%', `<script type="module" src="./index.js"></script>`),
      css: css,
    }
  }
}
