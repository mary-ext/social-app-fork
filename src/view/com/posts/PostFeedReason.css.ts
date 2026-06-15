import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const includeReason = style({
	alignItems: 'center',
	color: colors.textContrastMedium,
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	marginBottom: 2,
	marginLeft: (13 + 4) * -1,
});
