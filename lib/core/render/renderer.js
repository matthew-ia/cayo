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

    let cssElements = '';
    if (cssOptions.internal === false) {
      if (this.template.css && this.template.css.code !== '') {
        cssElements += `<link rel="stylesheet" href="/__index.css">\n`;
      }
      
      cssElements += `<link rel="stylesheet" href="./index.css">`;
      for (const [name, cayo] of Object.entries(cayoAssets)) {
        if (cayo.css.code !== '') {
          cssElements += `\n<link rel="stylesheet" href="/${name}.css">`;
        }
      }
    } else {
      if (this.template.css && this.template.css.code !== '') {
        cssElements += `<style>/* Template CSS */${this.template.css.code}</style>\n`;  
      }
      cssElements += `<style>${css.code}</style>`;
      for (const [name, cayo] of Object.entries(cayoAssets)) {
        if (cayo.css.code !== '') {
          cssElements += `<style>/* ${name} CSS */${cayo.css.code}</style>\n`;
        }
      }
    }

    cssElements += '\n<link data-cayo-assets-css>';

    // Note: Q: why the `() => str` for 2nd replacement arg?
    //       A: In case there's dollar signs in that there string
    // https://stackoverflow.com/questions/9423722/string-replace-weird-behavior-when-using-dollar-sign-as-replacement
    return {
      html: this.template.html
      // FIXME#83: this regex is bad; accidentally removes elements like head
      // Ignore placeholders wrapped in HTML comments
      // .replace(/<!--[^]*\%cayo\.\w+\%[^]*-->/g, '') 
        .replace('%cayo.title%', () => !head.includes('<title>') ? `<title>${page.name} – Cayo</title>` : '')
        .replace('%cayo.head%', () => head)
        .replace('%cayo.body%', () => html)
        .replace('%cayo.css%', () => cssElements)
        // Vite needs the entry file in this format
        .replace('%cayo.script%', () => `<script type="module" src="./index.js"></script>`), 
      css,
    }
  }
}
