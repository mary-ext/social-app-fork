import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// fixed-height box shared by every state (loading / unavailable / available) of the post-embed presentation.
export const box = style({
	borderColor: vars.palette.contrast_100,
	borderRadius: 8,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	padding: 12,
});

// the resolved state stacks the invite card above the join button.
export const available = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	justifyContent: 'space-between',
});
