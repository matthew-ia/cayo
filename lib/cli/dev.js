import { serve } from './serve.js';
import { watch } from './watch.js';

export function dev(_cayo) {
  // for (const [,page] of _cayo.pages) {
  //   page.render(true, _cayo.stats.cayoComponents).then(() => 
  //     writePageFiles(page, config.cayoPath, config)
  //   );
  // }
  watch(_cayo);
  serve(_cayo.config);
}