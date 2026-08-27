import { keyframes, style } from '@vanilla-extract/css';

import { SCRIM_BACKGROUND } from '#/components/web/Button.css';
import { HEADER_HEIGHT } from '#/components/web/Layout/const';
import { driven, OVERLAP, SUPPORTS } from '#/components/web/Layout/scroll-away';
import { reveal } from '#/components/web/Layout/ScrollAway.css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

const height = `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px))`;

const buttonOnSolid = { backgroundColor: 'transparent', color: colors.contrast_600 };

const unscrim = keyframes({
	from: { backgroundColor: SCRIM_BACKGROUND, color: colors.white },
	to: buttonOnSolid,
});

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'sticky',
	top: 0,
	flexDirection: 'row',
	flexShrink: 0,
	gap: space.sm,
	alignItems: 'center',
	zIndex: zIndex.float,
	paddingTop: 'env(safe-area-inset-top, 0px)',
	paddingInline: space.lg,
	height,
	// the overlaid header consumes this much of the banner's scroll range.
	vars: { [OVERLAP]: height },
	'@supports': {
		[SUPPORTS]: {
			marginBottom: `calc(-1 * ${height})`,
		},
	},
});

export const content = style([reveal, { minWidth: 0 }]);

export const backButton = style([
	{
		selectors: {
			'&:hover:not(:disabled)': { boxShadow: 'inset 0 0 0 999px rgb(from currentColor r g b / 0.15)' },
		},
	},
	driven(unscrim, buttonOnSolid),
]);
