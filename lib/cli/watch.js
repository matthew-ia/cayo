import path from 'path';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { logger } from '../logger.js';
import * as compile from '../compile/index.js';
import { 
  writePageFiles,
  writeComponentFile,
  cleanCayoPath,
  writeTemplateCSS,
} from '../files.js';

export function watch(config, _cayo) {

  const watcher = chokidar.watch(config.src, {
    // awaitWriteFinish: {
    //   stabilityThreshold: 1,
    //   pollInterval: 250
    // },
  });

  const configWatcher = chokidar.watch(path.resolve(config.projectRoot, './cayo.config.js'));

  configWatcher.on('change', (filepath) => {
    logger.log.info(
      chalk.yellow(`> config updated... restart dev server to use new config.`),
      { timestamp: true, clear: true, }
    );
  })

  const logChange = (type) => {
    logger.log.info(
      `> ${type} updated`,
      { timestamp: true, clear: true, }
    );
  }

  watcher.on('change', async (filepath) => {
    if (filepath.endsWith('.svelte')) {
      // Handle Template
      if (filepath.endsWith(`${config.templateName}.svelte`)) {
        // Recompile and render template
        const Layout = await compile.layout(config);
        _cayo.layout = await Layout.render(true);
        // Recompile and render all pages
        _cayo.pages = await compile.pages(null, _cayo, cayoConfig);
        for (const page of _cayo.pages) {
          page.render(true, _cayo.stats.cayoComponents);
        }
        
        logChange('template')
      
      } else if (filepath.startsWith(config.pages)) {
        // Handle Pages
        await handlePage(filepath, _cayo, config);
        logChange('page');
      
      // Handle Cayo Components
      } else if (filepath.includes(`.${config.cayoComponentInfix}`)) {
        logChange('cayo component');
        // compile.components([filepath], stats, config);
        // find out which pages are affected and recompile/render those
        // 2. render all affected pages

        // getCayoComponents(config)
        //   .then((components) => {
        //     let componentModule = Object.entries(components).find(([, { modulePath }]) => modulePath === filepath);
        //     handleCayoComponent(componentModule[0], componentModule[1].modulePath, config);
        //   })

      // Handle Components
      } else if (filepath.startsWith(config.components)) {
        await handleComponent(filepath, _cayo, config);
        logChange('component');
        // compile.components([filepath], stats, config);
        // find out which pages are affected and recompile/render those
        // 2. render all affected pages

        // getPages(config)
        //   .then(() => {
        //     prerenderPages(config);
        //   })
  
      // TODO: watch component changes
      // } else if (componentFileChanged) {
      // find out which pages are affected
      // find out which components are affected (imports)?
      } else {
        // prerenderPages(config);
      }
    }
  });
  // watcher.close();
}

async function handleComponent(filepath, _cayo, config) {
  const { pages, stats } = _cayo;
  const component = (await compile.components([filepath], stats, config))[0];

  for (const [pagePath, pageDeps] of Object.entries(stats.dependencies.pages)) {
    if (pageDeps.has(filepath)) {
      // NOTE: we don't actually need to recompile the page, just rerender it
      // handlePage(pagePath, _cayo, config)

      // TODO: figure out how to handle nested dependencies, e.g. B inside of A, and A is in Page.
      //       when B changes, it should rerender Page.
      const [page] = findPage(pagePath, pages);
      console.log('branch', getDependencyBranch(page.sourcePath, stats.dependencies), '\n\n');
      try {
        await page.render(true, stats.cayoComponents);
        writePageFiles(page, config.cayoPath, config);
      } catch (err) {
        console.error('brrrrrr');
      }
    }
  }


  // related to the nested deps thing, I think this code is off
  // because dependent components don't need to be recompiled, the page just needs a rerender
  const components = [];
  for (const [componentPath, componentDeps] of Object.entries(stats.dependencies.components)) {
    if (componentDeps.has(filepath)) {
      components.push(componentPath);
    }
  }
  if (components.length > 0) {
    compile.components(components, stats, config);
  }

  

  // const dependentPages = [...stats.dependencies.pages].filter(deps => 
  //   deps.has(filepath)
  // );
  // const dependentComponents = stats.dependencies.components.filter(deps => 
  //   deps.has(filepath)
  // );

  // for (const page of dependentPages) {
  //   await handlePage(page.sourcePath, _cayo, config);
  // }

  // for (const dep of [...component.dependencies]) {

  // }

  // await compile.pages(dependentPages, _cayo, config);
  // rerender


}

async function handlePage(filepath, _cayo, config) {
  const { pages, stats } = _cayo;
  const [page, index] = findPage(filepath, pages);

  let sourcePath;
  if (page) {
    // Compile existing page
    sourcePath = pages[index].sourcePath
    pages[index] = (await compile.pages([sourcePath], _cayo, config))[0];
    await pages[index].render(true, stats.cayoComponents);
    writePageFiles(pages[index], config.cayoPath, config);

  } else {
    // Compile new page
    sourcePath = filepath;
    pages.push((await compile.pages([sourcePath], _cayo, config))[0]);
    await pages.at(-1).render(true, stats.cayoComponents);
    writePageFiles(pages.at(-1), config.cayoPath, config);
  }
}

function findPage(sourcePath, pages) {
  const index = pages.findIndex(page => page.sourcePath === sourcePath);

  return [
    index >= 0 ? pages[index] : false,
    index
  ]
}

// TODO: this logic actually needs to be how the main dep tree is aggregated
function getDependencyBranch(source, dependencies) {
  let branch = [...dependencies.pages[source]];

  for (const component of branch) {
    branch = [...branch, ...dependencies.components[component]];
  }

  return {
    path: source,
    dependencies: branch,
  }
}