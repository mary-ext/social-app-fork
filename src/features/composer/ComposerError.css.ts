import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const list = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingBottom: space.sm,
	paddingInline: space.sm,

	':empty': {
		display: 'none',
	},
});

export const box = style({
	display: 'flex',
	gap: space.sm,
	borderRadius: 8,
	backgroundColor: vars.palette.contrast_25,
	paddingBlock: space.sm,
	paddingInline: space.md,
});

export const column = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	flexGrow: 1,
	gap: 4,
	minWidth: 0,
});

export const icon = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	width: 20,
	height: 20,
	color: colors.negative_600,
});

export const dismiss = style({
	marginRight: -6,
	marginBlock: -2,
	width: 24,
	height: 24,
});
