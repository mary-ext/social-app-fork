import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const ROW_BLOCK_PADDING = space.md;

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	scrollPaddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const item = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	outline: 'none',
	width: '100%',
	gap: space._2xs,
	appearance: 'none',
	border: 'none',
	background: 'none',
	color: colors.text,
	font: 'inherit',
	cursor: 'pointer',
	textAlign: 'start',
	userSelect: 'none',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
	selectors: {
		'&[data-highlighted]': { backgroundColor: colors.contrast_25 },
	},
});

export const itemBorder = style({
	position: 'relative',
	'::after': {
		position: 'absolute',
		right: DIALOG_PADDING,
		bottom: 0,
		left: DIALOG_PADDING,
		borderBottom: `1px solid ${colors.borderContrastLow}`,
		content: '""',
	},
});

export const status = style({
	display: 'block',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
});
