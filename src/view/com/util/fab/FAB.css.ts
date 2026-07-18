import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

export const fab = style({
	display: 'flex',
	position: 'fixed',
	right: space._2xl,
	bottom: `calc(${fallbackVar(bottomBarHeightVar, '0px')} + ${space.lg}px)`,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: zIndex.raised,
	border: 'none',
	borderRadius: 9999,
	backgroundColor: colors.primary_500,
	padding: 0,
	width: 56,
	height: 56,
	cursor: 'pointer',
	selectors: {
		'&:active': { transform: 'scale(0.96)' },
	},
	'@media': {
		'screen and (min-width: 800px)': { display: 'none' },
	},
});
