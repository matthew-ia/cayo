/**
 * Svelte preprocessor that transforms Cayo component imports
 * from object references to string paths
 */
export function cayoComponentPreprocessor() {
  return {
    markup({ content }) {
      // Find all <Cayo component={VarName} usages in the markup
      const cayoVarNames = new Set();
      const cayoUsageRe = /<Cayo\b[^>]*?\bcomponent=\{(\w+)\}/g;
      let match;
      while ((match = cayoUsageRe.exec(content)) !== null) {
        cayoVarNames.add(match[1]);
      }

      if (cayoVarNames.size === 0) return;

      // For each used VarName, find its import statement and inject __cayoPath
      let code = content;
      for (const varName of cayoVarNames) {
        const importRe = new RegExp(
          `(import\\s+${varName}\\s+from\\s+['"](.+?)['"]\\s*;)`,
          's'
        );
        const importMatch = importRe.exec(code);
        if (importMatch) {
          const fullImport = importMatch[1];
          const importSource = importMatch[2];
          code = code.replace(
            fullImport,
            `${fullImport}\n${varName}.__cayoPath = '${importSource}';`
          );
        }
      }

      return code !== content ? { code } : null;
    }
  };
}