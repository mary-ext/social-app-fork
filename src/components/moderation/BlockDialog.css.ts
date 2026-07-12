import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space._2xl;

export const popup = style({
	height: 600,
	maxWidth: 420,
});

export const header = style({
	backgroundColor: colors.bg,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: space.xs,
	paddingBottom: space.lg,
	paddingInline: DIALOG_PADDING,
	paddingTop: DIALOG_PADDING,
});

export const groupsLabel = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.xs,
	paddingInline: DIALOG_PADDING,
	paddingTop: space.sm,
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBottom: space._2xl,
});

export const row = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	justifyContent: 'space-between',
	paddingBlock: space.sm,
	paddingInline: DIALOG_PADDING,
	width: '100%',
});

export const rowMain = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
	minWidth: 0,
});

export const rowText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});
