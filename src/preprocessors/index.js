import { cayoComponentPreprocessor } from './cayo-component.js';

/**
 * Cayo preprocessor for Svelte
 * Currently includes component import transformation
 * Future preprocessors and config options can be added here
 */
export function cayoPreprocess(options = {}) {
  return cayoComponentPreprocessor();
}