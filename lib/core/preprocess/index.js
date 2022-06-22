import path from 'path';
import { JSDOM } from 'jsdom';

// Transformers
import cayoComponentNames from './transformers/cayoComponentNames.js';

export default function preprocess(sourcePath, srcDirPath, cayoDirPath) {

  console.log('===== preprocessing... ', sourcePath);
  const script = (input) => {
    scriptPreprocessor(input, sourcePath, srcDirPath, cayoDirPath); 
  }

  const markup = (input) => {
    markupPreprocessor(input, sourcePath, srcDirPath, cayoDirPath);
  }

  return {
    script,
    markup,
  }
}

function scriptPreprocessor(input, sourcePath, srcDirPath, cayoDirPath) {

  // preprocessor function args (svelte.preprocess API)
  const { content, filename } = input;
  let newContent = content;
  // Regex for: strip comments
  newContent = newContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'');
  // ... resolveImports logic

  // Regex for: match imports
  // ../, ./, /
  // TODO: make sure this regex is good 
  const relativePathRegex = /(?!\')[\.{0,2}]+\/[\s\S]+?(?=\')/g;
  const imports = newContent.match(relativePathRegex);
  // console.log('handling...', filename);
  // console.log('source', sourcePath);
  console.log(`imports for ${filename}`, imports);

  const relative = filename.replace('src/', '');
  const absoluteBase = path.dirname(path.resolve(srcDirPath, relative));
  // console.log('abss', absoluteBase)

  if (imports) {
    for (const _path of imports) {
      let resolved = path.resolve(absoluteBase, _path);
      let relative = resolved.replace(`${srcDirPath}`, '');
      // console.log('oh', resolved);
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

  console.log('ummmm', newContent.includes('#cayo/component'));
  newContent = newContent
    .replace('#cayo/component', cayoComponentPath)
    .replace('cayo/component', cayoComponentPath);

  // console.log(sourcePath, '\n', content);

  return {
    code: newContent,
  }
}

function markupPreprocessor(input, sourcePath, srcDirPath, cayoDirPath) {
  // preprocessor function args (svelte.preprocess)
  const { content, filename } = input;
  let newContent = content;

  newContent = cayoComponentNames(content, filename);

  return {
    code: newContent,
  }
}
