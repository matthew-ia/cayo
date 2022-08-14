// const PageComponent = await import(outputPath);
// const { html, css } = renderer.render({ Component: PageComponent }, config);

// // TODO: make this pass html and css actual values (rather than the boolean used for testing)
// return { name: filename, path: filepath, html, css, dependencies: depender.dependencies };

export class Renderer {

  constructor(template) {
    this.template = template;
  }

  async render(page, config) {
    const { css: cssOptions } = config;

    const Component = await page.load();
    const res = Component.render();
    const { html, css, head } = res;
  
    // TODO: template function for page title
    // let title = Component.meta.title ? `${Component.meta.title}` : 'Cayo';

    let cssTag = '';
    if (cssOptions.internal === false) {
      if (this.template.css && this.template.css.code !== '') {
        cssTag += `<link rel="stylesheet" href="/__index.css">\n`;
      }
      if (css.code) {
        cssTag += `<link rel="stylesheet" href="./index.css">`;
      }
    } else {
      if (this.template.css && this.template.css.code !== '') {
        cssTag += `<style>/* Template CSS */${this.template.css.code}</style>\n`;  
      }
      cssTag += `<style>${css.code}</style>`;
    }

    // Note: Q: why the `() => str` for 2nd replacement arg?
    //       A: In case there's dollar signs in that there string
    // https://stackoverflow.com/questions/9423722/string-replace-weird-behavior-when-using-dollar-sign-as-replacement
    return {
      html: this.template.html
      // FIXME: this regex is bad; accidentally removes elements like head
      // Ignore placeholders wrapped in HTML comments
      // .replace(/<!--[^]*\%cayo\.\w+\%[^]*-->/g, '') 
        .replace('%cayo.title%', () => !head.includes('<title>') ? `<title>${page.name} – Cayo</title>` : '')
        .replace('%cayo.head%', () => head)
        .replace('%cayo.body%', () => html)
        .replace('%cayo.css%', () => cssTag)
        .replace('%cayo.script%', () => `<script type="module" src="./index.js"></script>`), 
      css,
    }
  }
}
