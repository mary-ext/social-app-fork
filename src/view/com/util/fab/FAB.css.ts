import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar } from '#/components/Shell/Shell.css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

export const fab = style({
	alignItems: 'center',
	backgroundColor: colors.primary_500,
	border: 'none',
	borderRadius: 9999,
	bottom: `calc(${fallbackVar(bottomBarHeightVar, '0px')} + ${space.lg}px)`,
	cursor: 'pointer',
	display: 'flex',
	height: 56,
	justifyContent: 'center',
	padding: 0,
	position: 'fixed',
	right: space._2xl,
	width: 56,
	zIndex: zIndex.sticky,
	selectors: {
		'&:active': { transform: 'scale(0.96)' },
	},
	'@media': {
		'screen and (min-width: 800px)': { display: 'none' },
	},
});
