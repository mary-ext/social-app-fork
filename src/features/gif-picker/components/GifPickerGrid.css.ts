import { style } from '@vanilla-extract/css';

import { searchInset } from '#/components/Dialog/Popup.css';

import { space } from '#/styles/tokens.css';

const CONTENT_TOP = `calc(${searchInset} + ${space.md}px)`;

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
	paddingBottom: space.lg,
	paddingInline: space.lg,
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
