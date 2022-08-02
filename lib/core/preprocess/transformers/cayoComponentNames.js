import { JSDOM } from 'jsdom';
import { logger } from '../../logger.js';
// import { generateCayoComponentId } from '../../utils.js';
import { parse, walk } from 'svelte/compiler';
import MagicString from 'magic-string';
import path from 'path';
import { addTrailingSlash } from '../../utils.js';

export default function cayoComponentNames(content, filename, config) {

  // Dir that's relative to the component path
  // We only need this if we see a Cayo component rendered
  // by the component currently being preprocessed
  // 
  // Note: this seems complicated, but it's so we don't have to know what 
  // the (relative) src directory is, if it's changed from the default of 
  // './src', and probably in a safer way than normal string manipulation
  

  // const getSrc = (src) => {
  //   // Get the components path based on the config
  //   let componentsPath = config.components.replace(config.src, '');
  //   // Remove trailing slash
  //   componentsPath = componentsPath.replace(path.sep, '');

  //   return path.join(componentsPath, src);
  // }

  const parsed = parse(content);
  const s = new MagicString(content);

  // const relativePathRegex = /(?!\')[\.{0,2}]+\/[\s\S]+?(?=\')/g;
  
  // NOTE: how to find "<Cayo src="<path>"
  // Doing ast stuff here is the only way I see it working, so maybe do it after compilation

  const propName = 'src';

  walk(parsed.html, {
    enter(node, parent) {
      if (node.type === 'InlineComponent' && node.name === 'Cayo') {
        if (node.attributes) {
          const attribute = node.attributes.find(attribute => attribute.name === propName);
          if (attribute) {
            const value = attribute.value[0];
            const type = value.type;
            if (type === 'Text') {
              
              let src = getSrc(value.data);
              s.overwrite(value.start, value.end, src);
              // cayoComponentPaths.push(value.data);
            } else if (type === 'MustacheTag') {
              if (value.expression.type === 'Literal') {
                let src = getSrc(value.expression.value);
                s.overwrite(value.expression.start, value.expression.end, src);
              } else {
                // console.log(node, attribute.value[0]);
                console.warn(`Cayo component instances requires the '${propName}' prop to be a string, but was ${attribute.value[0].expression}`);
              }
            } 
          } else {
            console.warn(`Cayo component instance without a '${propName}' prop value found`);
          } 
        } 
      }
    }
  });

  // console.log('help', s.toString());


  return {
    code: s.toString(),
    map: s.generateMap({ source: filename }).toString(),
  }

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
}

export function generateCayoComponentId(componentPath) {
  const id = componentPath
    .replace('.', '')
    .replace('/', '__')
    .replace('-', '_')
    .replace('.cayo.svelte', '')
  
  // const uniqueName = name;

  return id;
}