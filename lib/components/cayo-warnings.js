export function getWarnings(src, badProps) {
  const warnings = {};
  checkInvalidSrc(warnings, src);
  checkBadProps(warnings, src, badProps);
  return warnings;
}

// Warning: invalid src prop')
function checkInvalidSrc(warnings, src) {
  if (!src || typeof src !== 'string') {
    warnings.invalidSrc = {
      title: `Invalid src prop`,
      src: !src ? 'undefined' : typeof src,
      message: `The src prop is required and must be a string.`,
      log: `Use of <Cayo> without a src prop found. No cayo instance will be rendered.`,
    }
  }
}

// Warning: unserializable props
function checkBadProps(warnings, src, keys) {
  if (keys.length > 0) {
    let propsStr = '';
    for (let i = 0; i < keys.length; i++) {
      propsStr += `'${keys[i]}'`;
      if (i+1 < keys.length) {
        propsStr += `, `;
      }
    }
    warnings.badProps = {
      title: `Bad props`,
      src,
      message: `Unserializable props found: ${propsStr}. Cayo component props must be serializable in order to be passed during hydration.`,
      log: `Unserializable instance props found: ${propsStr}.`,
    }
  }
}