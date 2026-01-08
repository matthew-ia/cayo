<script>
  import { getWarnings } from './cayo-warnings.js';
  export let src = undefined;
  export let component = undefined; // New prop for component objects
  export let attributes;

  // Determine the actual source path
  let actualSrc;
  if (src) {
    // Traditional string src prop
    actualSrc = src;
  } else if (component && component.__cayoPath) {
    // Component object with extracted path
    actualSrc = component.__cayoPath;
  } else if (typeof component === 'string') {
    // Component passed as string directly
    actualSrc = component;
  } else {
    // Fallback error case
    actualSrc = '';
  }

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
  const warnings = getWarnings(actualSrc, badProps);
  const cayoInstanceData = {
    'data-cayo-src': !warnings.invalidSrc ? `${actualSrc}` : '',  
    'data-cayo-id': '', // will get set during prerender process based on the src
  };
  if (warnings) {
    cayoInstanceData['data-cayo-warn'] = JSON.stringify(warnings);
  }
</script>

<div 
  {...attributes}
  data-cayo-id={cayoInstanceData['data-cayo-id']}
  data-cayo-src={cayoInstanceData['data-cayo-src']}
  data-cayo-warn={cayoInstanceData['data-cayo-warn']}
>
  {@html `<script data-cayo-props type="application/json">${props}</script>`}
  <slot/>
</div>


