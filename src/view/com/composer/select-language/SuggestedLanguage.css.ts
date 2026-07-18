import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const outer = style({
	paddingTop: space.sm,
	paddingRight: space.lg,
	paddingBottom: space.sm,
	paddingLeft: space.lg,
});

export const inner = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 8,
	borderColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	padding: space.md,
	paddingLeft: space.lg,
});

export const icon = style({
	flexShrink: 0,
});

export const text = style({
	flexGrow: 1,
	minWidth: 0,
});

export const button = style({
	flexShrink: 0,
});
