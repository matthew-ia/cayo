import path from 'path';
import { JSDOM } from 'jsdom';

// Transformers
import cayoComponentNames from './transformers/cayoComponentNames.js';

export default function preprocess(config) {

  // console.log('===== preprocessing... ', sourcePath.split('/').pop());
  const script = (input) => {
    // console.log('======== script... ', sourcePath.split('/').pop());
    return scriptPreprocessor(input, config); 
  }

  const markup = (input) => {
    // console.log('======== markup... ', sourcePath.split('/').pop());
    return markupPreprocessor(input, config);
  }

  return {
    // script,
    // markup,
  }
}

function scriptPreprocessor(input, config) {

  // preprocessor function args (svelte.preprocess API)
  const { content, filename } = input;
  const { src: srcDirPath, cayoPath: cayoDirPath } = config;
  let newContent = content;
  // Regex for: strip comments
  newContent = newContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'');
  // ... resolveImports logic

  // Regex for: match imports
  // ../, ./, /
  // TODO: make sure this regex is good 
  const relativePathRegex = /(?!\')[\.{0,2}]+\/[\s\S]+?(?=\')/g;
  const imports = newContent.match(relativePathRegex);

  const relative = filename.replace('src/', '');
  const absoluteBase = path.dirname(path.resolve(srcDirPath, relative));
  // console.log('abss', absoluteBase)

  if (imports) {
    for (const _path of imports) {
      let resolved = path.resolve(absoluteBase, _path);
      // console.log('oh', _path, resolved);
      newContent = newContent.replace(_path, resolved);
      
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

  newContent = newContent
    .replace('#cayo/component', cayoComponentPath)
    .replace('cayo/component', cayoComponentPath);

  // console.log(sourcePath, '\n', content);

  return {
    code: newContent,
  }
}

function markupPreprocessor(input, config) {
  // preprocessor function args (svelte.preprocess)
  const { content, filename } = input;
  let newContent;

  newContent = cayoComponentNames(content, filename, config);
  // console.log('============',  newContent);

  return {
    ...newContent,
  }
}
