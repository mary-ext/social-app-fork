import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const list = style({
	minHeight: 500,
	overflowY: 'auto',
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_50 },
		'.theme--dark &': { backgroundColor: vars.palette.contrast_0 },
		'.theme--dim &': { backgroundColor: '#000000' },
	},
});

export const itemWrap = style({
	paddingInline: space.sm,
	paddingTop: space.sm,
	'@media': {
		'(min-width: 500px)': {
			paddingInline: space.md,
			paddingTop: space.md,
		},
	},
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: space.xl,
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	justifyContent: 'center',
	minHeight: 500,
	paddingInline: space.xl,
});

export const footerNote = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: space._2xl,
});
