<script>
  import * as crypto from 'crypto';

  export let name;

  // TODO: Consider error handling for required stuff
  // if (!name) throw new Error('No name id for component');

  function hash() {
    return crypto.randomBytes(3).toString('hex');
  }

  const json = JSON.stringify($$restProps);
</script>

<div data-cayo-id={`${name}-${hash()}`} data-cayo-props={json}>Cayo loading...<slot/></div>
<slot/>

