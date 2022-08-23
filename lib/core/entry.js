import { getEntryDependencies } from './dependencies.js';
import { generateCayoRuntimeImport } from './codegen.js';

export function processEntrySource(entry, page, _cayo) {
  try {
    entry.code = await fs.readFile(entry.path, { encoding: 'utf8' });
  } catch (err) {
    throw err;
  }
  
  let code = `${entry.code}`;
  // Rewrite dependency imports
  getEntryDependencies(entry, page, _cayo);
  for (const [relativeDep, srcRelativeDep] of entry.dependencies) {
    code = code.replace(relativeDep, srcRelativeDep);
  }
  // Prepend cayo runtime import to entry source code
  if (entry.renderCayos) {
    code = generateCayoRuntimeImport() + code;
  }

  return code;
}