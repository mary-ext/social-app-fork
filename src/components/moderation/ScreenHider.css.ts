import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	backgroundColor: colors.bg,
	paddingBlockStart: 100,
	paddingBlockEnd: 150,
	paddingInline: space.lg,
});

export const badgeWrap = style({
	display: 'flex',
	justifyContent: 'center',
	marginBottom: space.md,
});

export const badge = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 9999,
	backgroundColor: colors.contrast_975,
	width: 50,
	height: 50,
	color: colors.bg,
});

export const title = style({
	marginBottom: space.md,
	textAlign: 'center',
});

export const body = style({
	marginBottom: space.md,
	textAlign: 'center',
});

export const spacer = style({
	'@media': {
		'screen and (max-width: 799px)': { flexGrow: 1 },
	},
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	justifyContent: 'center',
	marginBlock: space.md,
});

export const pill = style({
	borderRadius: 9999,
});

export const learnMore = style({
	display: 'inline',
	border: 'none',
	background: 'none',
	padding: 0,
	font: 'inherit',
	cursor: 'pointer',
});
