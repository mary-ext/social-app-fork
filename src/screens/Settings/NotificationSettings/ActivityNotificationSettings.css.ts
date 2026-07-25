import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const error = style({
	paddingBottom: space.md,
	paddingInline: space.lg,
});

export const empty = style({
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const row = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const rowText = style({
	display: 'flex',
	flexGrow: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});
