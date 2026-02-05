import { SvelteComponentTyped } from 'svelte';

export interface EntryProps {
  /**
   * Path to the entry script file (defaults to "entry.js")
   */
  src?: string;
}

/**
 * Entry component that injects the hydration entry point script.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { Entry } from 'cayo';
 * </script>
 * 
 * <Entry src="custom.js" />
 * ```
 */
export default class Entry extends SvelteComponentTyped<EntryProps> {}
