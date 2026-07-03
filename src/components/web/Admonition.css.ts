import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

/**
 * bordered callout box whose accent border tracks its `type`.
 *
 * @param className escape hatch for custom styling
 */
export const outer = recipe(
	{
		base: {
			backgroundColor: vars.palette.contrast_0,
			borderRadius: 8,
			borderStyle: 'solid',
			borderWidth: 1,
			boxSizing: 'border-box',
			padding: 12,
		},
		variants: {
			type: {
				apology: { borderColor: vars.palette.contrast_300 },
				error: { borderColor: vars.palette.negative_500 },
				info: { borderColor: vars.palette.contrast_300 },
				tip: { borderColor: vars.palette.primary_500 },
				warning: { borderColor: vars.palette.yellow },
			},
		},
		defaultVariants: { type: 'info' },
	},
	{ debugId: 'outer' },
);

export const row = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
});

export const iconWrap = style({
	flexShrink: 0,
});

export const content = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 8,
	justifyContent: 'center',
	minHeight: 20,
	paddingRight: 12,
});
