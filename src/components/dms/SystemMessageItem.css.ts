import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const link = style({
	display: 'block',
	width: '100%',
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	marginTop: space.md,
	paddingInline: space.md,
});

// resets the native <button> that backs the invite-link Dialog.Trigger to an invisible, full-width
// clickable wrapper — the row inside owns all visible layout.
export const button = style({
	appearance: 'none',
	margin: 0,
	border: 'none',
	background: 'none',
	padding: 0,
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const icon = style({ marginRight: 2 });
