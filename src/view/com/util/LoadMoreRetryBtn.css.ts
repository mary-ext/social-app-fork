import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const button = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_0,
	border: 'none',
	borderRadius: 0,
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 14,
	marginTop: 1,
	padding: '12px 20px',
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
	},
});

export const label = style({
	flex: 1,
	minWidth: 0,
});
