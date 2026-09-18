import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const description = style({
	flexShrink: 0,
	paddingBottom: space.lg,
	paddingInline: DIALOG_PADDING,
});

export const groupsLabel = style({
	display: 'flex',
	flexDirection: 'column',
	paddingTop: space.sm,
	paddingBottom: space.xs,
	paddingInline: DIALOG_PADDING,
});

export const loading = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBottom: space._2xl,
});

export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingBlock: space.sm,
	paddingInline: DIALOG_PADDING,
	width: '100%',
});

export const rowMain = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	minWidth: 0,
});

export const rowText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});
