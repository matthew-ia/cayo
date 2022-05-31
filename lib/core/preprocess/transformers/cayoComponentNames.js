import { JSDOM } from 'jsdom';
import { logger } from '../logger.js';
import { generateCayoComponentId } from './utils.js';

export default function cayoComponentNames(content, filename) {

  const dom = new JSDOM(content.html);
  const { document } = dom.window;

  let cayoComponentPaths = [];
  document.querySelectorAll('[data-cayo-id]').forEach((el) => {
    
    if (el.dataset.cayoId !== '') {
      cayoComponentPaths.push(el.dataset.cayoId);
    } else {
      logger.error.warn(
        chalk.red(`Cayo component instance without a name found`) + chalk.dim(` ${page.name}`), 
        { timestamp: true, clear: false, }
      );
    }
  });

  // TODO: use generateCayoComponentId here, using the attribute value
  /* 
    Should we record the original path at this point, in stats? thinking we will need that for resolveDependencies
    Because we need to process those imports *after* module-ification, bc svelte should error if it sees bad imports
    (because they wont exist until later in the process, the module for a Cayo component, as referenced by a page or
    other component) 
  */

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

}