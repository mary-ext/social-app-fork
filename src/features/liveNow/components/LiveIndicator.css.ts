import { fontSizeVar, sizeLeadingVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';
import { components } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize, lineHeight } from '#/styles/tokens.css';

export const container = recipe(
	{
		base: {
			display: 'flex',
			position: 'absolute',
			right: 0,
			bottom: -5,
			left: 0,
			alignItems: 'center',
			justifyContent: 'center',
			pointerEvents: 'none',
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
			vars: { [sizeLeadingVar]: String(lineHeight.tight) },
			display: 'inline-block',
			backgroundColor: vars.palette.negative_500,
		},
		defaultVariants: { size: 'small' },
		variants: {
			size: {
				large: { vars: { [fontSizeVar]: fontSize.xs }, borderRadius: 5, paddingBlock: 2, paddingInline: 4 },
				small: { vars: { [fontSizeVar]: fontSize._2xs }, borderRadius: 4, paddingBlock: 1, paddingInline: 3 },
				tiny: { vars: { [fontSizeVar]: '7px' }, borderRadius: 4, paddingBlock: 1, paddingInline: 3 },
			},
		},
	},
	{ debugId: 'liveIndicatorPill' },
);
