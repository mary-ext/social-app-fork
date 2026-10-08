import { fallbackVar, style } from '@vanilla-extract/css';

import { bottomBarHeightVar, mainAnchor } from '#/components/Shell/Shell.css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { HOVER, hoverWithin, MOUSE, PRESSED } from '#/styles/interaction';
import { iconSize, zIndex } from '#/styles/tokens.css';

export const outer = style({
	position: 'fixed',
	bottom: `calc(${fallbackVar(bottomBarHeightVar, '0px')} + 30px)`,
	left: `calc(anchor(${mainAnchor} left, 0px) + 18px)`,
	zIndex: zIndex.float,
	'@media': {
		// move into the gutter when clear of the nav; 82px = 42px button + 40px gap
		'screen and (width >= 1300px) and (height >= 700px)': {
			left: `calc(anchor(${mainAnchor} left, 0px) - 82px)`,
		},
	},
});

export const button = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'transform 0.1s',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 999,
	borderColor: vars.palette.contrast_100,
	backgroundColor: vars.palette.contrast_0,
	padding: 0,
	width: 42,
	height: 42,
	overflow: 'hidden',
	cursor: 'pointer',
	selectors: {
		'&:active': { transform: 'scale(0.9)' },
	},
});

export const indicator = style({
	backgroundColor: vars.palette.primary_50,
});

export const hover = style({
	position: 'absolute',
	inset: 0,
	transition: 'opacity 0.1s',
	opacity: 0,
	backgroundColor: vars.palette.contrast_50,
	pointerEvents: 'none',
	willChange: 'opacity',
	selectors: {
		[hoverWithin(button)]: { opacity: 0.5 },
		[`${MOUSE}.theme--dim ${button}${HOVER} &, .theme--dim ${button}${PRESSED} &`]: { opacity: 0.45 },
		[`${MOUSE}.theme--dark ${button}${HOVER} &, .theme--dark ${button}${PRESSED} &`]: { opacity: 0.4 },
	},
});

export const icon = style({
	width: iconSize.lg,
	height: iconSize.lg,
	color: colors.textContrastMedium,
	position: 'relative',
	zIndex: 10,
});

export const iconIndicating = style({ color: colors.primary_500 });
