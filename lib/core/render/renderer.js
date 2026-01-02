export class Renderer {

  constructor(template) {
    this.template = template;
  }

  async render(page, config) {
    const { css: cssOptions } = config;
    const Component = await page.load();
    const res = Component.render();
    const { html, css, head } = res;

    let cssElements = '';
    if (cssOptions.internal === false) {
      if (this.template.css && this.template.css.code !== '') {
        cssElements += `<link rel="stylesheet" href="/__index.css">\n`;
      }
      cssElements += `<link rel="stylesheet" href="./index.css">`;
      
    } else {
      if (this.template.css && this.template.css.code !== '') {
        cssElements += `<style>/* Template CSS */${this.template.css.code}</style>\n`;  
      }
      cssElements += `<style>${css.code}</style>`;
    }

    cssElements += '\n<link data-cayo-assets-css>';

    const title = () => {
      let title = page.name;
      title = title.charAt(0).toUpperCase() + title.substring(1);
      return `<title>${title}</title>`
    }

    // Note: Q: why the `() => str` for 2nd replacement arg?
    //       A: In case there's dollar signs in that there string
    // https://stackoverflow.com/questions/9423722/string-replace-weird-behavior-when-using-dollar-sign-as-replacement
    return {
      html: this.template.html
        // Strip placeholders wrapped in HTML comments
        .replace(/<!--[\s\S]?%cayo\.\w+%[\s\S]*?(-->)/g, '')
        // Inject markup in the cayo placeholders
        .replace(/<template cayo="title">[\s\S]*?<\/template>/g, () => !head.includes('<title>') ? title() : '')
        .replace(/<template cayo="head">[\s\S]*?<\/template>/g, () => head)
        .replace(/<template cayo="body">[\s\S]*?<\/template>/g, () => html)
        .replace(/<template cayo="css">[\s\S]*?<\/template>/g, () => cssElements)
        // Vite needs the entry file in this format
        .replace(/<template cayo="script">[\s\S]*?<\/template>/g, () => `<script type="module" src="./index.js"></script>`), 
      css,
    }
  }
}
