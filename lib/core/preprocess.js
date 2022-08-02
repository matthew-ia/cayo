import path from 'path';
import { hash, generateCayoComponentId } from './utils.js';
import { JSDOM } from 'jsdom';

// TODO: consider removing, or just cleaning up for potential later use
//       ended up not needing it bc of exporting the cayo component bundle
//       from the cayo package itself (removed need for the script preprocessor)
//       and decided to handle the cayo IDs in a post-process (like it was)
//       after all (removed the need for the markup preprocessor)
export default function preprocess(sourcePath, srcDirPath, cayoDirPath) {

  const script = (input) => {
    scriptPreprocessor(input, sourcePath, srcDirPath, cayoDirPath); 
  }

  // const markup = ({content, filename}) => {

  // }

  return {
    script,
    // markup
  }
}

function scriptPreprocessor(input, sourcePath, srcDirPath, cayoDirPath) {
  // preprocessor function args (svelte.preprocess API)
  const {content, filename} = input;
  // Regex for: strip comments
  content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'');
  // ... resolveImports logic

  // Regex for: match imports
  // ../, ./, /
  // TODO: make sure this regex is good 
  const relativePathRegex = /(?!\')[\.{0,2}]+\/[\s\S]+?(?=\')/g;
  const imports = content.match(relativePathRegex);
  // console.log('handling...', filename);
  // console.log('source', sourcePath);
  console.log('imports', imports);

  const relative = filename.replace('src/', '');
  const absoluteBase = path.dirname(path.resolve(srcDirPath, relative));
  // console.log('abss', absoluteBase)

  if (imports) {
    for (const _path of imports) {
      let resolved = path.resolve(absoluteBase, _path);
      let relative = resolved.replace(`${srcDirPath}`, '');
      // console.log('oh', resolved);
      content = content.replace(_path, resolved);
      
      // let cayoPath = path.resolve(cayoDirPath, `./__cayo/${relative}`);

      // if (_path.endsWith('.svelte')) {
      //   cayoPath = cayoPath.replace('.svelte', '.svelte.js');
      //   content = content.replace(_path, cayoPath);
      // } else {
      //   content = content.replace(_path, resolved);
      // }
    }
  }


  // TODO: just precompile cayo.svelte.js so the import actually works just fine
  let cayoComponentPath = path.resolve(cayoDirPath, `./__cayo/cayo.svelte.js`);
  content = content
    .replace('#cayo/component', cayoComponentPath)
    .replace('cayo/component', cayoComponentPath);

  // console.log(sourcePath, '\n', content);

  return {
    code: content,
  }
}

function markupPreprocessor(input, sourcePath, srcDirPath, cayoDirPath) {
  // preprocessor function args (svelte.preprocess)
  const {content, filename} = input;

  const dom = new JSDOM(content.html);
  const { document } = dom.window;

  // const cayoComponentPaths
  
  return {
    code: content,
  }
}
