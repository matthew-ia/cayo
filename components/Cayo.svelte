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
  props.cayoComponentName = name;
  props.cayoInstanceId = `${name}-${HASH}`;
  const json = JSON.stringify(props);
</script>

<div data-cayo-id={props.cayoInstanceId} data-cayo-props={props}></div>
<!-- {@html `<data>${props}</data>`} -->
{@html `<!-- %cayo.data:${json}% -->`}
<slot/>

