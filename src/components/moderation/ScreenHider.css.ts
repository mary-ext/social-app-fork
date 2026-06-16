import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const container = style({
	backgroundColor: colors.bg,
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	paddingBlockEnd: 150,
	paddingBlockStart: 100,
	paddingInline: space.lg,
});

export const badgeWrap = style({
	display: 'flex',
	justifyContent: 'center',
	marginBottom: space.md,
});

export const badge = style({
	alignItems: 'center',
	backgroundColor: colors.contrast_975,
	borderRadius: 9999,
	color: colors.bg,
	display: 'flex',
	height: 50,
	justifyContent: 'center',
	width: 50,
});

export const title = style({
	marginBottom: space.md,
	textAlign: 'center',
});

export const body = style({
	marginBottom: space.md,
	textAlign: 'center',
});

// pushes the buttons to the bottom of the viewport on narrow (sub-`gtMobile`) screens, matching upstream.
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
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	display: 'inline',
	font: 'inherit',
	padding: 0,
});
