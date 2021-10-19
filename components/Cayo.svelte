<script>
  import * as crypto from 'crypto';
  // import { Boundary } from '@crownframework/svelte-error-boundary';

  export let name;

  // TODO: Consider error handling for required stuff
  // if (!name) throw new Error('No name for component');
  // try {
    // if (!name) throw new Error(`\x1b[31mCayo Component: 'name' prop is required and can't be an empty string`);
  // } catch (err) {
  //   new Error(err);
  // }

  function hash() {
    return crypto.randomBytes(3).toString('hex');
  }

  const json = JSON.stringify($$restProps);
</script>

<div data-cayo-id={name ? `${name}-${hash()}` : ''} data-cayo-props={json}>Cayo loading...<slot/></div>
<slot/>

