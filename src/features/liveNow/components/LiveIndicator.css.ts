import { fontSizeVar, sizeLeadingVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize, lineHeight } from '#/styles/tokens.css';

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
