import { globalStyle } from '@vanilla-extract/css';

import { reset } from '#/styles/layers.css';

/**
 * Global UA-default resets, emitted into the {@link reset} cascade layer so that layered component styles
 * (the `components` layer) win over them. Only rules whose job is to neutralize a browser default belong
 * here; overrides that must win regardless (e.g. the autofill background hack) stay unlayered in `style.css`.
 */

// remove the default link color so component text color governs.
globalStyle('a', { '@layer': { [reset]: { color: 'inherit' } } });

// buttons and inputs carry a UA-set font; reset it so inherited/component typography applies.
globalStyle('button, input, textarea', {
	'@layer': { [reset]: { font: 'inherit', lineHeight: 'inherit' } },
});

// drop the UA focus ring; components draw their own focus styles.
globalStyle('input:focus, textarea:focus', { '@layer': { [reset]: { outline: 0 } } });
