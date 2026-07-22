import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const header = style({
	display: 'flex',
	flexDirection: 'row-reverse',
	paddingBlock: space.md,
	paddingInline: space.lg,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
});

export const emptyState = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: space.xl,
});
