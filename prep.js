import fse from 'fs-extra';
import path from 'path';
const config = { projectRoot: 'test' };

// fse.copySync(`./${config.projectRoot}/src/__index.svelte`, './.cayo/prerender/__index.svelte');

const resolvedProjectRoot = path.resolve(process.cwd(), config.projectRoot);
const importStr = `
export default async function loadTemplate() {
  return (await import('${resolvedProjectRoot}/src/__index.svelte')).default;
}
`;

fse.outputFileSync(`${path.resolve(process.cwd(), '.cayo')}/prerender/template.js`, importStr);