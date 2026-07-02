import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const outer = style({
	paddingLeft: space.lg,
	paddingRight: space.lg,
	paddingTop: space.sm,
	paddingBottom: space.sm,
});

export const inner = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.md,
	borderWidth: 1,
	borderStyle: 'solid',
	borderColor: colors.borderContrastLow,
	borderRadius: 8,
	padding: space.md,
	paddingLeft: space.lg,
	backgroundColor: colors.bg,
});

export const icon = style({
	flexShrink: 0,
});

export const text = style({
	minWidth: 0,
	flexGrow: 1,
});

export const button = style({
	flexShrink: 0,
});
