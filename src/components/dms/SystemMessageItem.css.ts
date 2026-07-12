import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// resets the native <button> that backs the invite-link Dialog.Trigger to an invisible, full-width
// clickable wrapper — the row inside owns all visible layout.
export const button = style({
	appearance: 'none',
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	font: 'inherit',
	margin: 0,
	padding: 0,
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const icon = style({ marginRight: 2 });
