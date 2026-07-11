import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const base = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 4,
	display: 'inline-flex',
	paddingBlock: 3,
	paddingInline: 6,
});

export const badge = base;

export const trigger = style([
	base,
	{
		appearance: 'none',
		border: 'none',
		cursor: 'pointer',
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			'&:hover, &[data-popup-open]': { backgroundColor: vars.palette.contrast_0 },
		},
	},
]);
