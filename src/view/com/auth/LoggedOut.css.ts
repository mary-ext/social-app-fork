import { style } from '@vanilla-extract/css';

import { CENTER_COLUMN_WIDTH } from '#/components/web/Layout/const';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	width: '100%',
	maxWidth: 280,
});

export const brand = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
});

export const container = style({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	width: '100%',
	maxWidth: CENTER_COLUMN_WIDTH,
	minHeight: '100vh',
	marginInline: 'auto',
	paddingTop: 'env(safe-area-inset-top, 0px)',
	paddingBottom: 'env(safe-area-inset-bottom, 0px)',
	backgroundColor: vars.palette.contrast_0,
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space._5xl,
	flexGrow: 1,
	height: '100%',
	paddingBottom: '20vh',
	'@media': {
		'(max-width: 767px)': {
			paddingBottom: space._5xl,
		},
	},
});

export const footer = style({
	position: 'absolute',
	inset: 0,
	top: 'auto',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	alignItems: 'center',
	gap: space.xl,
	paddingBlock: space.lg,
	paddingInline: space.xl,
	borderTop: `1px solid ${vars.palette.contrast_200}`,
});

export const footerSpacer = style({
	flexGrow: 1,
});

export const logotypeWrap = style({
	paddingTop: space._5xl,
	paddingBottom: space.sm,
});
