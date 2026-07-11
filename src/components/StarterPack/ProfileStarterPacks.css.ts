import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const createAnother = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	display: 'flex',
	justifyContent: 'center',
	paddingBottom: space.lg,
	paddingTop: space.lg,
});
