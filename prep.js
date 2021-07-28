import fse from 'fs-extra';

const config = { projectRoot: 'test' };

fse.copySync(`./${config.projectRoot}/src/__index.svelte`, './.cayo/prerender/__index.svelte');