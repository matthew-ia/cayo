<script>
  import crypto from 'crypto';

  export let name;
  export let props = {};

  // TODO: Consider error handling for required stuff
  // if (!name) throw new Error('No name id for component');

  function hash() {
    return crypto.randomBytes(3).toString('hex');
  }

  const HASH = hash();
  const json = JSON.stringify(props);
  props.cayoComponentName = name;
  props.cayoInstanceId = `${name}-${HASH}`;
</script>

<div data-cayo-id={props.cayoInstanceId}></div>
{@html `<!-- %cayo.data:${json}% -->`}
<slot/>

