import { serve } from './serve.js';
import { watch } from './watch.js';
import { writePageFiles } from '../files.js';

export function dev(config, _cayo) {
  // for (const [,page] of _cayo.pages) {
  //   page.render(true, _cayo.stats.cayoComponents).then(() => 
  //     writePageFiles(page, config.cayoPath, config)
  //   );
  // }
  watch(config, _cayo);
  serve(config, _cayo);
}