import { JSDOM } from 'jsdom';
import { logger } from '../../logger.js';
import { generateCayoComponentId } from '../../utils.js';


export default function cayoComponentNames(content, filename, config) {

  let newContent = content;

  const relativePathRegex = /(?!\')[\.{0,2}]+\/[\s\S]+?(?=\')/g;
  // NOTE: how to find "<Cayo src="<path>"
  // Doing ast stuff here is the only way I see it working, so maybe do it after compilation
  // const imports = newContent.match(relativePathRegex);
  // const dom = new JSDOM(content);
  // const { document } = dom.window;
  // if (filename.includes('howdy'))
  //   console.log(dom.window.document.documentElement.outerHTML);

  // let cayoComponentPaths = [];
  // let cayoComponentIDs = [];
  // let cayoComponentElements = document.querySelectorAll('cayo');

  // cayoComponentElements.forEach((el) => {
  //   console.log('pls', JSON.stringify(el));
  //   if (el.src !== '') {
  //     cayoComponentPaths.push(el.src);
  //     console.log('==== src', el.src);
  //     const id = generateCayoComponentId(el.src);
  //     el.dataset.id = id;
  //     cayoComponentIDs.push(id);

  //   } else {
  //     logger.error.warn(
  //       chalk.red(`Cayo component instance without a name found`) + chalk.dim(` ${page.name}`), 
  //       { timestamp: true, clear: false, }
  //     );
  //   }
  // });

  // console.log('the ids', cayoComponentIDs);

  // TODO: use generateCayoComponentId here, using the attribute value
  /* 
    Should we record the original path at this point, in stats? thinking we will need that for resolveDependencies
    Because we need to process those imports *after* module-ification, bc svelte should error if it sees bad imports
    (because they wont exist until later in the process, the module for a Cayo component, as referenced by a page or
    other component) 
  */
  // const cayoIDs = cayoComponentPaths.map((cayoPath) => {
  //   return generateCayoComponentId(cayoPath);
  // });

  // TODO: think this part can be removed
  // const componentNameRegex = /(?<name>\w+)(?=\.cayo\.svelte)/; // Foo-{hash}
  // const components = cayoIds.reduce((components, id) => {
  //   let name = id.match(componentNameRegex).groups.name;
  //   if (!componentNames.includes(name)) {
  //     logger.error.warn(
  //       chalk.red(
  //         `Cayo component with name '${name}' does not exist but is trying to be rendered`
  //       ) + chalk.dim(` ${page.name}`), 
  //       { timestamp: true, clear: false, }
  //     );
  //     return components;
  //   }

  //   if (!components[name]) {
  //     components[name] = [id]
  //   } else {
  //     components[name].push(id);
  //   }
  //   return components;
  // }, {});

  // Return the processed HTML
  // return dom.window.document.documentElement.outerHTML;
  return newContent;
}