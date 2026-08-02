import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const warning = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: 12,
	paddingInline: 16,
});
