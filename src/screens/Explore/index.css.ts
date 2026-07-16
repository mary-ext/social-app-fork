import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
});

export const heading = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	display: 'none',
	paddingBottom: space.lg,
	paddingInline: space.lg,
	paddingTop: space.sm,
	'@media': {
		'(width >= 1300px)': { display: 'flex' },
	},
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	justifyContent: 'center',
	paddingBlock: space._4xl,
});
