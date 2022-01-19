import path from 'path';

export class Renderer {

  constructor(template) {
    this.template = template;
  }

  render(page, config) {
    const { css: cssOptions } = config;

    const { Component } = page;
    const { html, css, head } = Component.render();

    // TODO: template function for page title
    let title = page.meta.title ? `${page.meta.title}` : 'Cayo';

    let cssTag = '';
    if (cssOptions.internal === false) {
      if (this.template.css.code !== '') {
        cssTag += `<link rel="stylesheet" href="/__index.css">\n`;
      }
      cssTag += `<link rel="stylesheet" href="./index.css">`;
    } else {
      if (this.template.css.code !== '') {
        cssTag += `<style>/* Template CSS */${this.template.css.code}</style>\n`;  
      }
      cssTag += `<style>${css.code}</style>`;
    }

    // NOTE: Q: why the `() => str` for 2nd replacement arg?
    //       A: In case there's dollar signs in that there string
    // https://stackoverflow.com/questions/9423722/string-replace-weird-behavior-when-using-dollar-sign-as-replacement

    return {
      html: this.template.html
        // Ignore placeholders wrapped in HTML comments
        .replace(/<!--[^]*\%cayo\.\w+\%[^]*-->/g, '') 
        // Replace placeholders in template
        .replace('%cayo.title%', () => !head.includes('<title>') ? `<title>${title}</title>` : '')
        .replace('%cayo.head%', () => head)
        .replace('%cayo.body%', () => html)
        .replace('%cayo.css%', () => cssTag)
        .replace('%cayo.script%', () => `<script type="module" src="./index.js"></script>`)
      ,
      css: css,
    }
  }
}
