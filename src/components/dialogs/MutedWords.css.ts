import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 24,
});

export const addSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const intro = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const group = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

// two-up on phones, one row of four past the gtMobile breakpoint — matching the original layout.
export const durationGrid = style({
	display: 'grid',
	gap: 8,
	gridTemplateColumns: 'repeat(2, 1fr)',
	'@media': {
		'(min-width: 800px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
	},
});

export const radioRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: 8,
});

export const addButton = style({ width: '100%' });

export const error = style({
	backgroundColor: vars.palette.negative_400,
	borderRadius: 8,
	padding: 12,
});

export const errorText = style({ fontStyle: 'italic' });

export const divider = style({ borderTop: `1px solid ${vars.palette.contrast_100}` });

export const listSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
});

export const notice = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 12,
	paddingBlock: 12,
	paddingInline: 16,
});

export const noticeText = style({ fontStyle: 'italic' });

export const row = style({
	alignItems: 'flex-start',
	borderRadius: 12,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	justifyContent: 'space-between',
	paddingBlock: 12,
	paddingInline: 16,
});

export const rowAlt = style({ backgroundColor: vars.palette.contrast_25 });

export const rowContent = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 4,
	minWidth: 0,
});

export const word = style({
	overflowWrap: 'break-word',
	wordBreak: 'break-word',
});

export const metaRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
});

export const renewLink = style({
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	font: 'inherit',
	margin: 0,
	padding: 0,
});
