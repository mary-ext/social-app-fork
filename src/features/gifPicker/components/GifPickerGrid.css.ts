import { style } from '@vanilla-extract/css';

import { DIALOG_PADDING, SEARCH_HEIGHT } from '#/features/gifPicker/layout';

import { space } from '#/styles/tokens.css';

// the search field overlaps the top of the scroller, so content starts below it.
const CONTENT_TOP = SEARCH_HEIGHT + space.md;

export const scroll = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	scrollPaddingTop: CONTENT_TOP,
});

export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingTop: CONTENT_TOP,
	paddingBottom: DIALOG_PADDING,
	paddingInline: DIALOG_PADDING,
	minHeight: '100%',
});

export const columns = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const column = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.sm,
	minWidth: 0,
});
