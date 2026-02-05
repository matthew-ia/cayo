import { SvelteComponentTyped } from 'svelte';

export interface CayoProps {
  /**
   * Component object with __cayoPath property or string path
   */
  component?: object | string;
  
  /**
   * HTML attributes to spread on the wrapper div
   */
  attributes?: Record<string, any>;

  /**
   * Traditional string path to the component file
   * @deprecated Use `component` prop instead for better type safety and preprocessor support
   */
  src?: string;
}

/**
 * Cayo component wrapper that handles hydration and renders components.
 * 
 * Accepts a component via the `component` prop and passes additional props 
 * to the child component via `$$restProps`.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { Cayo } from 'cayo';
 *   import Counter from './components/counter.cayo.svelte';
 * </script>
 * 
 * <Cayo 
 *   component={Counter} 
 *   count={0}
 *   attributes={{ class: "counter-wrapper" }}
 * />
 * ```
 */
export default class Cayo extends SvelteComponentTyped<CayoProps & Record<string, any>> {}
