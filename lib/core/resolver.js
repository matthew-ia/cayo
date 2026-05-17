import path from 'path';
import { createRequire } from 'module';

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

  if (path.isAbsolute(importSource)) {
    // Already an absolute path (injected by preprocessor from a relative import)
    resolved = importSource;
  } else if (importSource.startsWith('./') || importSource.startsWith('../')) {
    // Relative import — resolve directly from the importing file's directory
    resolved = path.resolve(path.dirname(fromFile), importSource);
  } else {
    // Try Rollup plugins from user config (e.g. @rollup/plugin-alias).
    // Flatten in case plugins is a nested array.
    const plugins = [].concat(config.vite?.rollupOptions?.plugins ?? []).flat();
    let pluginResolved = null;
    // Provide a minimal Rollup plugin context. Some plugins (e.g. @rollup/plugin-alias)
    // call `this.resolve()` after doing their substitution and fall back to `{ id }` when
    // it returns null — which is exactly what we want here.
    const fakeContext = { resolve: async () => null };
    for (const plugin of plugins) {
      if (!plugin?.resolveId) continue;
      try {
        const result = await plugin.resolveId.call(fakeContext, importSource, fromFile, {});
        if (result) {
          pluginResolved = typeof result === 'string' ? result : result.id;
          break;
        }
      } catch {}
    }

    if (pluginResolved) {
      resolved = pluginResolved;
    } else {
      // Bare or scoped package specifier — use Node's require.resolve() anchored
      // to the consumer's file so node_modules lookup works correctly.
      const require = createRequire(fromFile);
      try {
        resolved = require.resolve(importSource);
      } catch {
        throw new Error(
          `Could not resolve import source '${importSource}' from '${fromFile}'.`
        );
      }
    }
  }

  cache.set(cacheKey, resolved);
  return resolved;
}
