import path from 'path';

/**
 * Svelte preprocessor that transforms Cayo component imports
 * from object references to string paths
 */
export function cayoComponentPreprocessor() {
  return {
    markup({ content, filename }) {
      // Find all <Cayo component={...}> usages in the markup
      const cayoImports = new Set();
      const cayoUsageRe = /<Cayo\b[^>]*?\bcomponent=\{(\w+)\}/g; // <Cayo component={Counter} />
      let match;
      while ((match = cayoUsageRe.exec(content)) !== null) {
        cayoImports.add(match[1]);
      }

      if (cayoImports.size === 0) return;

      // For each import binding used as a Cayo prop, find its import statement and inject __cayoPath.
      // Strip comments from script blocks before searching so commented-out imports are not matched.
      let code = content;
      const scriptRe = /(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/g;
      const strippedCode = content.replace(scriptRe, (_, open, body, close) => {
        const stripped = body
          .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments /* ... */
          .replace(/^\s*\/\/.*$/mg, '');        // line comments //
        return `${open}${stripped}${close}`;
      });

      for (const cayoImport of cayoImports) {
        const importRe = new RegExp(
          `(import\\s+${cayoImport}\\s+from\\s+['"](.+?)['"]\\s*;)`, // import Counter from './Counter.svelte';
          's'
        );
        const importMatch = importRe.exec(strippedCode);
        if (importMatch) {
          const fullImport = importMatch[1];
          let importSource = importMatch[2];
          // Resolve relative paths to absolute so the path stays correct regardless
          // of which file ultimately consumes this component (e.g. a kit component
          // used in a consumer project).
          if (importSource.startsWith('./') || importSource.startsWith('../')) {
            importSource = path.resolve(path.dirname(filename), importSource);
          }
          code = code.replace(
            fullImport,
            `${fullImport}\n${cayoImport}.__cayoPath = '${importSource}';`
          );
        }
      }

      return code !== content ? { code } : null;
    }
  };
}