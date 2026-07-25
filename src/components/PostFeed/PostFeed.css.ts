import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const description = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: space.lg,
});
