<script>
  export let src;
  import { getWarnings } from './cayo-warnings.js';

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

  const json = JSON.stringify({...$$restProps}, replacer);
  const warnings = getWarnings(src, badProps);
  const cayoInstanceData = {
    'data-cayo-id': '',
    'data-cayo-src': !warnings.invalidSrc ? `${src}` : '',  
    'data-cayo-props': json,
  };
  if (warnings) {
    cayoInstanceData['data-cayo-warn'] = JSON.stringify(warnings);
  }

  delete cayoInstanceData['class'];
</script>
<div 
  data-cayo-id={cayoInstanceData['data-cayo-id']}
  data-cayo-src={cayoInstanceData['data-cayo-src']}
  data-cayo-props={cayoInstanceData['data-cayo-props']}
  data-cayo-warn={cayoInstanceData['data-cayo-warn']}
>
  <slot/>
</div>


