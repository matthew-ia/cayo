import path from 'path';
import resolve from '@rollup/plugin-node-resolve';

const cache = new Map();

/**
 * Resolve an import source to an absolute filesystem path.
 *
 * @param {string} importSource  - The import specifier as written by the user
 *                                 (e.g. './Counter.cayo.svelte', 'my-pkg/Some.svelte', '@scope/pkg/Widget.svelte')
 * @param {string} fromFile      - Absolute path of the file that contains the import
 * @param {object} config        - Cayo config object
 * @returns {Promise<string>}    - Absolute filesystem path to the component
 */
export async function resolveImportSource(importSource, fromFile, config) {
  const cacheKey = `${importSource}::${fromFile}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let resolved;

  if (importSource.startsWith('./') || importSource.startsWith('../')) {
    // Relative import — resolve directly from the importing file's directory
    resolved = path.resolve(path.dirname(fromFile), importSource);
  } else {
    // Bare or scoped package specifier — use Rollup's node-resolve plugin
    const resolver = resolve({
      browser: false,
      exportConditions: ['svelte'],
      extensions: ['.svelte'],
      dedupe: ['svelte'],
    });

    // The plugin's resolveId hook may be sync or async
    const result = await resolver.resolveId(importSource, fromFile, {});
    if (!result) {
      throw new Error(
        `Could not resolve import source '${importSource}' from '${fromFile}'.`
      );
    }
    resolved = typeof result === 'string' ? result : result.id;
  }

  cache.set(cacheKey, resolved);
  return resolved;
}
