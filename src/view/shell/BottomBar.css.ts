import { style } from '@vanilla-extract/css';

import * as navBadge from '#/view/shell/nav-badge.css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const bottomBar = style({
	backgroundColor: colors.bg,
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: 'env(safe-area-inset-bottom, 0px)',
	paddingLeft: 'env(safe-area-inset-left, 0px)',
	paddingRight: 'env(safe-area-inset-right, 0px)',
});

export const bottomBarHideBorder = style({
	borderTopColor: colors.bg,
});

export const ctrl = style({
	alignItems: 'center',
	justifyContent: 'center',
	display: 'flex',
	height: 50,
	flex: 1,
	flexDirection: 'column',
	position: 'relative',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:active': { backgroundColor: colors.contrast_50 },
		'&:focus-visible': { outline: `2px solid ${colors.primary_500}`, outlineOffset: -2 },
		'&:hover': { backgroundColor: colors.contrast_25 },
	},
});

export const badge = style([navBadge.badge, { left: '52%', top: 8, zIndex: 1 }]);

export const hasNewBadge = style([navBadge.hasNewDot, { left: '54%', marginLeft: 4, top: 10, zIndex: 1 }]);

export const avatarRing = style({
	border: `2px solid transparent`,
});

export const avatarRingActive = style({
	borderColor: colors.text,
});

export const signInRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	justifyContent: 'space-between',
	paddingBottom: 12,
	paddingLeft: 16,
	paddingRight: 16,
	paddingTop: 12,
	width: '100%',
});

export const logoGroup = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const logotypeWrapper = style({
	display: 'flex',
	paddingTop: 4,
});
