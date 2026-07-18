import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const includeReason = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	alignItems: 'center',
	marginBottom: 2,
	marginLeft: (13 + 4) * -1,
	color: colors.textContrastMedium,
});
