import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
});

export const heading = style({
	display: 'none',
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingTop: space.sm,
	paddingBottom: space.lg,
	paddingInline: space.lg,
	'@media': {
		'(width >= 1300px)': { display: 'flex' },
	},
});

export const empty = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._4xl,
});
