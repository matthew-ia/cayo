<script>
  export let src;
  import { logger } from '../core/logger';
  import chalk from 'chalk';

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

  function getWarning(badPropKeys) {
    let warning = '';
    // Warning: unserializable props
    if (badPropKeys.length > 0) {
      let propsStr = '';
      for (let i = 0; i < badPropKeys.length; i++) {
        propsStr += `'${badPropKeys[i]}'`;
        if (i+1 < badPropKeys.length) {
          propsStr += `, `;
        }
      }
      warning = `Unserializable props found: ${propsStr}.`;
      logger.log.info(`${chalk.yellow(warning)} ${chalk.dim(`instance of ${src}`)}`, { timestamp: true, clear: true, });
      warning += `\n\nCayo component props are stringified as JSON before being parsed again during runtime, so they must be serializable.\n`;
    }

    return warning;
  }

  const json = JSON.stringify({...$$restProps}, replacer);
  const warning = getWarning(badProps);
</script>

<div data-cayo-src={src ? `${src}` : ''} data-cayo-props={json} data-cayo-warn={warning}>
  <slot/>
</div>
