import logger from '../logger.js';
import chalk from 'chalk';

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
    // Check for deprecated %cayo.*% syntax and log deprecation warnings
    // Use a more specific regex and avoid overlapping matches
    const deprecatedPlaceholders = [];
    const regex = /%cayo\.[a-zA-Z]+%/g;
    let match;
    while ((match = regex.exec(this.template.html)) !== null) {
      deprecatedPlaceholders.push(match[0]);
    }
    
    if (deprecatedPlaceholders.length > 0 && !this._deprecationWarningLogged) {
      this._deprecationWarningLogged = true;
      const uniquePlaceholders = [...new Set(deprecatedPlaceholders)];

      
      logger.log.info(
        chalk.yellow.bold('Deprecation Warning') + chalk.yellow(` [Page: ${page.name}]: Found deprecated placeholder syntax: ${uniquePlaceholders.join(', ')}. Please migrate to <template cayo="..."> syntax. \nMore info: https://github.com/matthew-ia/cayo#template-placeholder-migration`),
        { timestamp: true, clear: false }
      );
    }

    return {
      html: this.template.html
        // Strip placeholders wrapped in HTML comments
        .replace(/<!--[\s\S]?%cayo\.\w+%[\s\S]*?(-->)/g, '')
        // Inject markup in the new template cayo placeholders
        .replace(/<template cayo="title">[\s\S]*?<\/template>/g, () => !head.includes('<title>') ? title() : '')
        .replace(/<template cayo="head">[\s\S]*?<\/template>/g, () => head)
        .replace(/<template cayo="body">[\s\S]*?<\/template>/g, () => html)
        .replace(/<template cayo="css">[\s\S]*?<\/template>/g, () => cssElements)
        .replace(/<template cayo="script">[\s\S]*?<\/template>/g, () => `<script type="module" src="./index.js"></script>`)
        // Support deprecated %cayo.*% syntax for backward compatibility
        .replace(/%cayo\.title%/g, () => !head.includes('<title>') ? title() : '')
        .replace(/%cayo\.head%/g, () => head)
        .replace(/%cayo\.body%/g, () => html)
        .replace(/%cayo\.css%/g, () => cssElements)
        .replace(/%cayo\.script%/g, () => `<script type="module" src="./index.js"></script>`), 
      css,
    }
  }
}
