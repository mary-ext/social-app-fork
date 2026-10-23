import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { space } from '#/styles/tokens.css';

const DIALOG_PADDING = space.lg;

export const description = style({
	flexShrink: 0,
	paddingBottom: space.lg,
	paddingInline: DIALOG_PADDING,
});

export const groups = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingBottom: space.lg,
	paddingInline: DIALOG_PADDING,
});

export const groupsBox = style({
	display: 'flex',
	flexDirection: 'column',
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: 8,
	overflow: 'hidden',
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
	width: '100%',
});

export const previewRow = style({
	padding: space.md,
	selectors: {
		'& + &': {
			borderTop: `1px solid ${colors.borderContrastLow}`,
		},
	},
});

export const listRow = style({
	paddingBlock: space.sm,
	paddingInline: DIALOG_PADDING,
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

export const seeMore = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	justifyContent: 'center',
	border: 'none',
	borderTop: `1px solid ${colors.borderContrastLow}`,
	borderRadius: 0,
	backgroundColor: 'transparent',
	padding: space.md,
	width: '100%',
	cursor: 'pointer',
	selectors: {
		[hover()]: {
			backgroundColor: colors.contrast_25,
		},
	},
});
