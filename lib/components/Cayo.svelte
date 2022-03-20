<script>
  // TODO: consider using same hash tool as Svelte
  // import { Boundary } from '@crownframework/svelte-error-boundary';

  // export let name;
  export let src;

  // TODO: Consider error handling for required stuff
  // if (!name) throw new Error('No name for component');
  // try {
    // if (!name) throw new Error(`\x1b[31mCayo Component: 'name' prop is required and can't be an empty string`);
  // } catch (err) {
  //   new Error(err);
  // }

  // console.log(Component);
  
  const json = JSON.stringify($$restProps);
</script>

<div data-cayo-id={src ? `${src}` : ''} data-cayo-props={json}>
  <slot/>
</div>

