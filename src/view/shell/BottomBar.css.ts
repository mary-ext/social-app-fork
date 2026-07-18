import { style } from '@vanilla-extract/css';

import * as navBadge from '#/view/shell/nav-badge.css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const bottomBar = style({
	display: 'flex',
	flexDirection: 'row',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	paddingRight: 'env(safe-area-inset-right, 0px)',
	paddingBottom: 'env(safe-area-inset-bottom, 0px)',
	paddingLeft: 'env(safe-area-inset-left, 0px)',
});

export const bottomBarHideBorder = style({
	borderTopColor: colors.bg,
});

export const ctrl = style({
	display: 'flex',
	position: 'relative',
	flex: 1,
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	height: 50,
	selectors: {
		'&:active': { backgroundColor: colors.contrast_50 },
		'&:focus-visible': { outline: `2px solid ${colors.primary_500}`, outlineOffset: -2 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

export const badge = style([navBadge.badge, { top: 8, left: '52%', zIndex: 1 }]);

export const hasNewBadge = style([navBadge.hasNewDot, { top: 10, left: '54%', zIndex: 1, marginLeft: 4 }]);

export const avatarRing = style({
	border: `2px solid transparent`,
});

export const avatarRingActive = style({
	borderColor: colors.text,
});

export const signInRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingTop: 12,
	paddingRight: 16,
	paddingBottom: 12,
	paddingLeft: 16,
	width: '100%',
});

export const logoGroup = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
});

export const logotypeWrapper = style({
	display: 'flex',
	paddingTop: 4,
});
