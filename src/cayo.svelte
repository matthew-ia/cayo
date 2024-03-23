<script>
  import { getWarnings } from './cayo-warnings.js';
  export let src;
  export let attributes;

  // Save unserializable prop keys (during stringification)
  // so we can report them later
  const badProps = [];
  function replacer(key, value) {
    const type = typeof value;
    if (
      type === 'function' || 
      type === 'undefined' || 
      type === 'symbol'
    ) {
      badProps.push(key);
    }
    
    return value;
  };

  // const props = toSource({...$$restProps})
  const props = JSON.stringify({...$$restProps}, replacer);
  const warnings = getWarnings(src, badProps);
  const cayoInstanceData = {
    'data-cayo-src': !warnings.invalidSrc ? `${src}` : '',  
    'data-cayo-id': '', // will get set during prerender process based on the src
  };
  if (warnings) {
    cayoInstanceData['data-cayo-warn'] = JSON.stringify(warnings);
  }
</script>

<div 
  data-cayo-id={cayoInstanceData['data-cayo-id']}
  data-cayo-src={cayoInstanceData['data-cayo-src']}
  data-cayo-warn={cayoInstanceData['data-cayo-warn']}
  {...attributes}
>
  {@html `<script data-cayo-props type="application/json">${props}</script>`}
  <slot/>
</div>


