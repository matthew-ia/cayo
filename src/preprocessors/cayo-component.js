/**
 * Svelte preprocessor that transforms Cayo component imports
 * from object references to string paths
 */
export function cayoComponentPreprocessor() {
  return {
    script({ content, attributes }) {
      // Only process if the script contains .cayo.svelte imports
      if (!content.includes('.cayo.svelte')) return;
      
      // Transform: import Component from '$components/Component.cayo.svelte' or './components/Component.cayo.svelte'
      // Into: import Component from '...'; Component.__cayoPath = 'Component.cayo.svelte';
      const transformedContent = content.replace(
        /import\s+(\w+)\s+from\s+['"]([^'"]*\/)?([^\/'"]+\.cayo\.svelte)['"]\s*;/g,
        (match, varName, pathPrefix, filename) => {
          return `${match}\n  if (${varName}) ${varName}.__cayoPath = '${filename}';`;
        }
      );
      
      return transformedContent !== content ? { code: transformedContent } : null;
    }
  };
}