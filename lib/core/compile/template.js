import path from 'path';
import fs from 'fs-extra';
import { build } from '../bundle.js';
import { Component } from '../component.js';
import { writeTemplateCSS } from '../files.js';

export async function compileTemplate(_cayo) {
  const { template: templatePath, templateName } = _cayo.config;
  let filename = `${templateName}.svelte`;
  try {
    const { code, dependencies } = await build(templatePath, _cayo.config, 'template');
    let outputPath = path.resolve(_cayo.config.cayoPath, `./__cayo/template.js`);
    await fs.outputFile(outputPath, code);

    const Template = new Component('template', code, templatePath, outputPath, dependencies, _cayo.config);
    _cayo.template = await Template.render(_cayo, { load: true });
    await writeTemplateCSS(_cayo.template.css, _cayo);

    return Template;

  } catch (err) {
    throw new Error(`Compiling template: ${filename}\n` + err);
  }
}