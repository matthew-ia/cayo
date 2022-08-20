import { create_ssr_component, compute_rest_props, add_attribute } from 'svelte/internal';
import { createLogger } from 'vite';
import chalk from 'chalk';

const infoLogger = createLogger('info', {
  prefix: chalk.magenta.bold('[cayo]'),
  // allowClearScreen: true,
});
createLogger('error', {
  prefix: chalk.red.bold('[cayo]'),
  // allowClearScreen: true,
});

const errorLogger = (err) => {
  let errorMessage = err;
  if (err.stack) errorMessage = err.stack;
  console.error(chalk.red.bold(`${errorMessage}`));
  if (err.cause) console.error('> Cause:', err.cause);
};

const logger = { 
  log: infoLogger,
  error: errorLogger,
};

/* lib/components/Cayo.svelte generated by Svelte v3.49.0 */

const Cayo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
	let $$restProps = compute_rest_props($$props, ["src"]);
	let { src } = $$props;
	const badProps = [];

	function replacer(key, value) {
		const type = typeof value;

		if (type === 'function' || type === 'undefined' || type === 'symbol') {
			badProps.push(key);
		}

		return value;
	}

	function getWarning(badPropKeys) {
		let warning = '';

		// Warning: unserializable props
		if (badPropKeys.length > 0) {
			let propsStr = '';

			for (let i = 0; i < badPropKeys.length; i++) {
				propsStr += `'${badPropKeys[i]}'`;

				if (i + 1 < badPropKeys.length) {
					propsStr += `, `;
				}
			}

			warning = `Unserializable props found: ${propsStr}.`;
			logger.log.info(`${chalk.yellow(warning)} ${chalk.dim(`instance of ${src}`)}`, { timestamp: true, clear: true });
			warning += `\n\nCayo component props are stringified as JSON before being parsed again during runtime, so they must be serializable.\n`;
		}

		return warning;
	}

	const json = JSON.stringify({ ...$$restProps }, replacer);
	const warning = getWarning(badProps);
	if ($$props.src === void 0 && $$bindings.src && src !== void 0) $$bindings.src(src);

	return `<div${add_attribute("data-cayo-src", src ? `${src}` : '', 0)}${add_attribute("data-cayo-props", json, 0)}${add_attribute("data-cayo-warn", warning, 0)}>
  ${slots.default ? slots.default({}) : ``}
</div>`;
});

export { Cayo as default };