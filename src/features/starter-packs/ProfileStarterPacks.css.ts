import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const createAnother = style({
	display: 'flex',
	justifyContent: 'center',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	paddingTop: space.lg,
	paddingBottom: space.lg,
});
