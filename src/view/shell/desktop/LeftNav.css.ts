import { createVar, style } from '@vanilla-extract/css';

import * as navBadge from '#/view/shell/nav-badge.css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

import {
	LARGE_ELEMENT_SIZE,
	LEFT_NAV_MINIMAL_WIDTH,
	LEFT_NAV_PWI_WIDTH,
	LEFT_NAV_STANDARD_WIDTH,
} from './constants';

const TIMING = 'cubic-bezier(0.17, 0.73, 0.14, 1)';

export const root = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	padding: space.lg,
	width: LEFT_NAV_STANDARD_WIDTH,
});

export const rootPwi = style({
	width: LEFT_NAV_PWI_WIDTH,
});

export const rootMinimal = style({
	alignItems: 'center',
	overflowX: 'hidden',
	width: LEFT_NAV_MINIMAL_WIDTH,
});

export const signInWrap = style({
	paddingTop: space.xl,
});

const avatarActiveTransform = createVar();

export const profileCard = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.md,
});

export const profileCardFull = style({
	alignItems: 'flex-start',
	width: '100%',
});

export const avatarPlaceholder = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 999,
	height: LARGE_ELEMENT_SIZE,
	width: LARGE_ELEMENT_SIZE,
});

export const avatarPlaceholderInset = style({
	marginLeft: space.lg,
});

export const profileTrigger = style({
	alignItems: 'center',
	background: 'transparent',
	border: 0,
	borderRadius: 999,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	justifyContent: 'space-between',
	paddingBlock: 0,
	paddingInlineEnd: space.md,
	paddingInlineStart: space.lg,
	textAlign: 'left',
	transitionDelay: '50ms',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: TIMING,
	vars: { [avatarActiveTransform]: 'scale(0.6667) translateX(-22px)' },
	width: '100%',
	selectors: {
		'&:hover, &:focus-visible, &[data-popup-open]': {
			backgroundColor: vars.palette.contrast_25,
			transitionDelay: '0ms',
		},
	},
});

export const profileTriggerMinimal = style({
	justifyContent: 'center',
	paddingInline: 0,
	vars: { [avatarActiveTransform]: 'scale(0.8)' },
	width: 'auto',
});

const active = (child: string) =>
	`${profileTrigger}:hover ${child}, ${profileTrigger}:focus-visible ${child}, ${profileTrigger}[data-popup-open] ${child}`;

export const avatarWrap = style({
	position: 'relative',
	transitionDelay: '50ms',
	transitionDuration: '250ms',
	transitionProperty: 'transform',
	transitionTimingFunction: TIMING,
	zIndex: 10,
	'@media': {
		'(prefers-reduced-motion: reduce)': { transition: 'none' },
	},
	selectors: {
		[active('&')]: { transform: avatarActiveTransform, transitionDelay: '0ms' },
	},
});

export const identity = style({
	alignItems: 'start',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	marginLeft: -space.xl,
	opacity: 0,
	transitionDelay: '50ms',
	transitionDuration: '100ms',
	transitionProperty: 'opacity',
	transitionTimingFunction: TIMING,
	selectors: {
		[active('&')]: { opacity: 1, transitionDelay: '0ms' },
	},
});

export const ellipsisIcon = style({
	flexShrink: 0,
	opacity: 0,
	transitionDuration: '100ms',
	transitionProperty: 'opacity',
	transitionTimingFunction: TIMING,
	selectors: {
		[active('&')]: { opacity: 1 },
	},
});

export const navItem = style({
	alignItems: 'center',
	borderRadius: 999,
	display: 'flex',
	flexDirection: 'row',
	boxSizing: 'border-box',
	gap: space.sm,
	outlineOffset: -1,
	padding: space.md,
	textDecoration: 'none',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: TIMING,
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_25 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -1 },
	},
});

export const iconBox = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	position: 'relative',
	width: 24,
	zIndex: 1,
});

export const badge = style([navBadge.badge, { left: 12, top: -6 }]);

export const hasNewDot = style([navBadge.hasNewDot, { right: -2, top: -4 }]);

export const composeRow = style({
	display: 'flex',
	flexDirection: 'row',
	paddingLeft: space.md,
	paddingTop: space.lg,
});

export const composeRowMinimal = style({
	display: 'flex',
	paddingTop: space.lg,
});

export const composeButtonMinimal = style({
	height: LARGE_ELEMENT_SIZE,
	padding: 0,
	width: LARGE_ELEMENT_SIZE,
});
