import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const SEARCH_NEGATIVE_MARGIN = 42;
const ROW_BLOCK_PADDING = space.md;

export const popup = style({
	maxWidth: 500,
	height: 600,
});

export const header = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'space-between',
	backgroundColor: colors.bg,
	paddingTop: DIALOG_PADDING,
	paddingBottom: space.md,
	paddingInline: DIALOG_PADDING,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

export const closeButton = style({
	margin: -space.sm,
});

export const search = style({
	zIndex: zIndex.raised,
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
	backgroundColor: 'transparent',
	backgroundImage: `linear-gradient(${colors.bg} 50%, ${colorMix(colors.bg, '0%')})`,
	paddingInline: DIALOG_PADDING,
});

export const list = style({
	paddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const tabs = style({
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: colors.borderContrastLow,
	paddingTop: space.sm,
	paddingBottom: DIALOG_PADDING,
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	paddingBlock: 20,
	paddingInline: DIALOG_PADDING,
});

export const emptyMessage = style({
	fontStyle: 'italic',
});
