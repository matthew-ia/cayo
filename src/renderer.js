
export class Renderer {

  constructor(templateHtml) {
    this.template = templateHtml;
  }

  render(page, config) {
    const { css: cssOptions } = config;

    const { Component } = page;
    const { html, css, head } = Component.render();

    // TODO: template function for page title
    let title = page.meta.title ? `${page.meta.title} — Cayo` : 'Cayo';

    let cssTag = '';
    if (cssOptions.internal === false) {
      cssTag = `<link rel="stylesheet" href="./index.css">`;
    } else {
      cssTag = `<style>${css.code}</style>`;
    }

    return {
      html: this.template
        // Ignore placeholders wrapped in HTML comments
        .replaceAll(/<!--[^]*\%cayo\.\w+\%[^]*-->/g, '') 
        // Replace placeholders in template
        .replace('%cayo.title%', !head.includes('<title>') ? `<title>${title}</title>` : '')
        .replace('%cayo.head%', head)
        .replace('%cayo.body%', html)
        .replace('%cayo.css%', cssTag)
        .replace('%cayo.script%', `<script type="module" src="./index.js"></script>`),
      css: css,
    }
  }
}
