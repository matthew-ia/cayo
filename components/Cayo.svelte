<script>
  import * as crypto from 'crypto';

  export let name;
  export let props = {};

  // TODO: Consider error handling for required stuff
  // if (!name) throw new Error('No name id for component');

  function hash() {
    return crypto.randomBytes(3).toString('hex');
  }

  const HASH = hash();
  const json = JSON.stringify(props);
</script>

<div data-cayo-id={`${name}-${HASH}`} data-cayo-props={json}></div>
<slot/>

