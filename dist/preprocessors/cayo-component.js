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
        // Try all common import forms. Semicolon is optional.
        // 1. Default:   import X from '...'
        // 2. Named:     import { X } from '...'  (incl. aliased: { Foo as X })
        // 3. Namespace: import * as X from '...'
        const importPatterns = [
          { re: new RegExp(`(import\\s+${cayoImport}\\s+from\\s+['"](.+?)['"]\\s*;?)`, 's'), named: false },
          { re: new RegExp(`(import\\s*\\{[^}]*\\b${cayoImport}\\b[^}]*\\}\\s*from\\s+['"](.+?)['"]\\s*;?)`, 's'), named: true },
          { re: new RegExp(`(import\\s*\\*\\s+as\\s+${cayoImport}\\s+from\\s+['"](.+?)['"]\\s*;?)`, 's'), named: false },
        ];
        let importMatch = null;
        let isNamedImport = false;
        for (const { re, named } of importPatterns) {
          importMatch = re.exec(strippedCode);
          if (importMatch) { isNamedImport = named; break; }
        }
        if (importMatch) {
          const fullImport = importMatch[1];
          let importSource = importMatch[2];

          if (importSource.startsWith('./') || importSource.startsWith('../')) {
            // Relative — resolve to absolute using the current file's directory.
            importSource = path.resolve(path.dirname(filename), importSource);
          } else if (isNamedImport) {
            // Named import from a barrel — encode as JSON so cayos.js can generate
            // a synthetic entry that re-exports the specific component as default.
            // Handle aliasing: `import { FooCayo as Foo }` → export name is `FooCayo`.
            const bracesMatch = fullImport.match(/\{([^}]*)\}/);
            let exportName = cayoImport;
            if (bracesMatch) {
              const aliasRe = new RegExp(`(\\w+)\\s+as\\s+${cayoImport}\\b`);
              const aliasMatch = aliasRe.exec(bracesMatch[1]);
              if (aliasMatch) exportName = aliasMatch[1];
            }
            importSource = JSON.stringify({ from: importSource, named: exportName });
          }

          const escapedSource = importSource.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          code = code.replace(
            fullImport,
            `${fullImport}\n${cayoImport}.__cayoPath = '${escapedSource}';`
          );
        }
      }

      return code !== content ? { code } : null;
    }
  };
}

