/**
 * Svelte preprocessor that transforms .cayo.svelte imports
 * Adds __cayoPath property to imported components for runtime path resolution
 * 
 * @example
 * ```javascript
 * // svelte.config.js
 * import { cayoPreprocess } from 'cayo';
 * 
 * export default {
 *   preprocess: cayoPreprocess()
 * };
 * ```
 */
export function cayoPreprocess(): {
  markup: (options: { content: string; filename: string }) => { code: string };
};
