import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const card = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	boxSizing: 'border-box',
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
	':hover': {
		backgroundColor: colors.contrast_25,
	},
});
