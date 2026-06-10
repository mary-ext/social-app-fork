import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { borderRadius } from '#/styles/tokens.css';

// the themed border color/opacity flow through these vars rather than being set directly in the `.theme--… &`
// selectors. those selectors carry 2-class specificity, which would out-specify the prop modifiers below
// (`opaque`/`focused`) within the shared `components` layer; routing the values through vars keeps base's
// `border-color`/`opacity` declarations at single-class specificity, so a modifier emitted later in the same
// layer overrides them by source order — the same way a recipe variant beats its base.
const borderColorVar = createVar();
const borderOpacityVar = createVar();

/**
 * Thin inset border overlay matching the RNW `MediaInsetBorder`: a hairline that thins to 0.5px on hi-dpi
 * screens (the `@media` query replaces the runtime `IS_HIGH_DPI` check). Light theme uses a solid
 * low-contrast border; dark/dim use a higher-contrast border at 60% opacity.
 *
 * Sits in the `components` layer so the sibling modifiers below — and any (unlayered) consumer `className`
 * override — win over it without a specificity bump.
 */
export const base = style(
	layered(components, {
		borderColor: borderColorVar,
		borderRadius: borderRadius.md,
		borderStyle: 'solid',
		borderWidth: 1,
		bottom: 0,
		left: 0,
		opacity: borderOpacityVar,
		pointerEvents: 'none',
		position: 'absolute',
		right: 0,
		top: 0,
		vars: {
			[borderColorVar]: vars.palette.contrast_100,
			[borderOpacityVar]: '1',
		},
		'@media': {
			'(min-resolution: 2dppx)': { borderWidth: 0.5 },
		},
		selectors: {
			'.theme--dark &, .theme--dim &': {
				vars: {
					[borderColorVar]: vars.palette.contrast_300,
					[borderOpacityVar]: '0.6',
				},
			},
		},
	}),
);

/** Match an adjacent opaque border (used where the border abuts other borders, e.g. link previews). */
export const opaque = style(layered(components, { borderColor: vars.palette.contrast_100, opacity: 1 }));

/** Focus ring for the active carousel slide — a 2px border that wins over the hairline. */
export const focused = style(layered(components, { borderWidth: 2 }));
