import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const button = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 14,
	alignItems: 'center',
	marginTop: 1,
	border: 'none',
	borderRadius: 0,
	backgroundColor: vars.palette.contrast_0,
	padding: '12px 20px',
	width: '100%',
	textAlign: 'left',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
	},
});

export const label = style({
	flex: 1,
	minWidth: 0,
});
