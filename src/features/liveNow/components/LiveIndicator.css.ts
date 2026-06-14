import { fontSizeVar, sizeLeadingVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize, lineHeight } from '#/styles/tokens.css';

/** Absolute overlay that pins the LIVE pill to the bottom-center of its positioned parent. */
export const container = recipe(
	{
		base: {
			alignItems: 'center',
			bottom: -5,
			display: 'flex',
			justifyContent: 'center',
			left: 0,
			pointerEvents: 'none',
			position: 'absolute',
			right: 0,
		},
		defaultVariants: { size: 'small' },
		variants: {
			size: {
				large: { bottom: -8 },
				small: {},
				tiny: {},
			},
		},
	},
	{ debugId: 'liveIndicatorContainer', layer: components },
);

// styles the {@link Text} badge itself; emitted unlayered (no `layer`) so the per-size `fontSizeVar` override
// wins over `Text`'s layered `size` variant, letting `Text` derive the line-height — including the off-grid
// 7px tiny size that has no font-size token. the compact pill pins the paired leading ratio tight (the
// default `md` ratio would over-space the single uppercase line).
export const pill = recipe(
	{
		base: {
			backgroundColor: vars.palette.negative_500,
			display: 'inline-block',
			vars: { [sizeLeadingVar]: String(lineHeight.tight) },
		},
		defaultVariants: { size: 'small' },
		variants: {
			size: {
				large: { borderRadius: 5, paddingBlock: 2, paddingInline: 4, vars: { [fontSizeVar]: fontSize.xs } },
				small: { borderRadius: 4, paddingBlock: 1, paddingInline: 3, vars: { [fontSizeVar]: fontSize._2xs } },
				tiny: { borderRadius: 4, paddingBlock: 1, paddingInline: 3, vars: { [fontSizeVar]: '7px' } },
			},
		},
	},
	{ debugId: 'liveIndicatorPill' },
);
