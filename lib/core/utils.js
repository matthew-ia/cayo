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

export function deterministicHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 7);
}

export function generateCayoComponentId(importSource) {
  // Derive name from the filename stem of the import source
  const segment = importSource.split('/').pop() ?? importSource;
  let name = segment.replace(/\.svelte$/, '').replace(/\.cayo$/, '');
  name = `${name}_${deterministicHash(importSource)}`;
  const id = name;

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