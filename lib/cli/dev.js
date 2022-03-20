import { serve } from './serve.js';
import { watch } from './watch.js';

export function dev(config, compile, prerender, logger, CAYO) {
  prerender(CAYO.layout, null, config, logger);
  watch(config, compile, prerender, logger, CAYO.stats);
  serve(config);
}