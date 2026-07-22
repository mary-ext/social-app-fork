import { style } from '@vanilla-extract/css';

import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const toggle = style({
	appearance: 'none',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	marginTop: space.md,
	paddingInline: space.md,
	border: 'none',
	background: 'none',
	cursor: 'pointer',
});

export const chevron = recipe(
	{
		base: {
			display: 'inline-flex',
			marginLeft: space._2xs,
		},
		variants: {
			expanded: {
				true: { transform: 'rotate(-180deg)' },
			},
		},
	},
	{ debugId: 'systemMessageGroupChevron' },
);
