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
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 8,
	display: 'flex',
	gap: space.sm,
	paddingBlock: space.sm,
	paddingInline: space.md,
});

export const column = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	gap: 4,
	minWidth: 0,
	position: 'relative',
});

export const icon = style({
	alignItems: 'center',
	color: colors.negative_600,
	display: 'flex',
	flexShrink: 0,
	height: 20,
	justifyContent: 'center',
	width: 20,
});

export const dismiss = style({
	height: 24,
	width: 24,
	marginRight: -6,
	marginBlock: -2,
});
