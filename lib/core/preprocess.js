import path from 'path';

export default function cayoPreprocess(sourcePath, srcDirPath, cayoDirPath) {
  const script = ({ content, filename }) => {
    // strip comments
    content = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'');
    // ... resolveImports logic
  
    // match imports
    // ../, ./, /
    // TODO: make sure this regex is good 
    const relativePathRegex = /(?!\')[\.{0,2}]+\/[\s\S]+?(?=\')/g;
    const imports = content.match(relativePathRegex);
    // console.log('handling...', filename);
    // console.log('source', sourcePath);
    // console.log('imports', imports);
    
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

  return {
    script,
  }
}