import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const header = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'space-between',
	borderBottom: `1px solid ${colors.borderContrastMedium}`,
	backgroundColor: vars.palette.contrast_0,
	padding: space.lg,
});

export const title = style({
	display: 'flex',
	minWidth: 0,
});

export const closeButton = style({
	margin: -space.sm,
});

export const status = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space.md,
	paddingBlock: space._4xl,
});

export const listHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: space.lg,
	paddingInline: space.lg,
});

export const chips = style({
	flex: 1,
	minWidth: 0,
});

export const selectAll = style({
	alignSelf: 'flex-start',
});

export const selectionRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.md,
});

export const footerContent = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: space.md,
});
