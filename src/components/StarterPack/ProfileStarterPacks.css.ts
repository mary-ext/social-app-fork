import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

/**
 * The "Create another" footer row: a centered shortcut button under a hairline top separator, shown to a
 * profile owner beneath their existing starter packs.
 */
export const createAnother = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	display: 'flex',
	justifyContent: 'center',
	paddingBottom: space.lg,
	paddingTop: space.lg,
});
