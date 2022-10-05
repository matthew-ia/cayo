import path from 'path';
import crypto from 'crypto';
import fs from 'fs-extra';

// https://github.com/sveltejs/svelte/blob/master/src/compiler/compile/utils/hash.ts
export function hash(str = '', bytes = 5) {
  const random = crypto.randomBytes(bytes).toString('hex');
  str += random;
  
  str = str.replace(/\r/g, '');
  let hash = 5381;
  let i = str.length;

  while (i--) hash = ((hash << bytes) - hash) ^ str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

export function generateSafeName(inputPath) {
  let safeName = inputPath
    .replace(/^\.\//g, '')
    .replace(/\.\.\//g, '')
    .replace(/\/+/g, '__')
    .replace(/\-+/g, '_');

  // safeName += `_${hash(inputPath)}`;
  return { name: safeName, suffix: hash(inputPath) };
}

export function generateCayoComponentId(componentPath) {
  let { name, suffix } = generateSafeName(componentPath)
  name = name.replace('.cayo.svelte', ''); 
  name += `_${suffix}`;
  const id = `${name}-${hash(name)}`;

  return {
    id,
    name,
  };
}

// Credit: https://github.com/snowpackjs/astro
/** Add / to the end of string (but don’t double-up) */
export function addTrailingSlash(_path) {
  return _path.replace(/\/?$/, '/');
}

export function normalizePath(root, _path) {
  if (root === _path) return root;
  return path.normalize(path.join(root, addTrailingSlash(_path)));
}

// TODO: need to use this somewhere?
export function getOutDir(config) {
  return config.mode === 'production' ? config.buildOptions.outDir : config.cayoPath;
}

export async function debugStats(_cayo) {
  const { stats, config } = _cayo;
  fs.outputFile(path.resolve(config.cayoPath, './__cayo/stats.json'), JSON.stringify(
    stats, 
    (key, value) => value instanceof Set ? [...value] : value,
    2
  ));
}