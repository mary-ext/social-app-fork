import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const SEARCH_NEGATIVE_MARGIN = 42;
const ROW_BLOCK_PADDING = space.md;

export const popup = style({
	height: 600,
	maxWidth: 500,
});

export const header = style({
	alignItems: 'center',
	backgroundColor: colors.bg,
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	justifyContent: 'space-between',
	paddingBottom: space.md,
	paddingInline: DIALOG_PADDING,
	paddingTop: DIALOG_PADDING,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

export const closeButton = style({
	margin: -space.sm,
});

export const search = style({
	backgroundColor: 'transparent',
	backgroundImage: `linear-gradient(${colors.bg} 50%, ${colorMix(colors.bg, '0%')})`,
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
	paddingInline: DIALOG_PADDING,
	zIndex: zIndex.raised,
});

export const list = style({
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
	paddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
});

export const tabs = style({
	borderBottomColor: colors.borderContrastLow,
	borderBottomStyle: 'solid',
	borderBottomWidth: 1,
	paddingBottom: DIALOG_PADDING,
	paddingTop: space.sm,
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: 20,
	paddingInline: DIALOG_PADDING,
});

export const emptyMessage = style({
	fontStyle: 'italic',
});
