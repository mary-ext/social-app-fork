import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space, zIndex } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;
const SEARCH_NEGATIVE_MARGIN = space.md;
const ROW_BLOCK_PADDING = space.sm;

export const popup = style({
	height: 600,
	maxWidth: 500,
});

export const header = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
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
	paddingInline: DIALOG_PADDING,
	marginBottom: -SEARCH_NEGATIVE_MARGIN,
	zIndex: zIndex.sticky,
});

export const list = style({
	paddingTop: SEARCH_NEGATIVE_MARGIN + (DIALOG_PADDING - ROW_BLOCK_PADDING),
	paddingBottom: DIALOG_PADDING - ROW_BLOCK_PADDING,
});

export const row = style({
	boxSizing: 'border-box',
	paddingBlock: ROW_BLOCK_PADDING,
	paddingInline: DIALOG_PADDING,
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
