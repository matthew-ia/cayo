import { create_ssr_component, compute_rest_props, spread, escape_object } from 'svelte/internal';

function getWarnings(src, badProps) {
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
    };
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
    };
  }
}

/* lib/components/Cayo.svelte generated by Svelte v3.49.0 */

const Cayo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let $$restProps = compute_rest_props($$props, ["src"]);
	let { src } = $$props;

	// Save unserializable prop keys (during stringification)
	// so we can report them later
	const badProps = [];

	function replacer(key, value) {
		const type = typeof value;

		if (type === 'function' || type === 'undefined' || type === 'symbol') {
			badProps.push(key);
		}

		return value;
	}
	const json = JSON.stringify({ ...$$restProps }, replacer);
	const warnings = getWarnings(src, badProps);

	const cayoInstanceData = {
		'data-cayo-id': '',
		'data-cayo-src': !warnings.invalidSrc ? `${src}` : '',
		'data-cayo-props': json
	};

	if (warnings) {
		cayoInstanceData['data-cayo-warn'] = JSON.stringify(warnings);
	}

	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);

	return `<div${spread([escape_object(cayoInstanceData)], {})}>
  ${slots.default ? slots.default({}) : ``}
</div>`;
});

export { Cayo as default };
