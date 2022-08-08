<script>
  export let src;

  // TODO: Consider error handling for required stuff
  // if (!name) throw new Error('No name for component');
  // try {
    // if (!name) throw new Error(`Cayo Component: 'name' prop is required and can't be an empty string`);
  // } catch (err) {
  //   new Error(err);
  // }
  
  const json = JSON.stringify($$restProps);
</script>

<div data-cayo-src={src ? `${src}` : ''} data-cayo-props={json}>
  <slot/>
</div>

