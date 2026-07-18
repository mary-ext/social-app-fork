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
	width: LEFT_NAV_MINIMAL_WIDTH,
	overflowX: 'hidden',
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
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_50,
	width: LARGE_ELEMENT_SIZE,
	height: LARGE_ELEMENT_SIZE,
});

export const avatarPlaceholderInset = style({
	marginLeft: space.lg,
});

export const profileTrigger = style({
	vars: { [avatarActiveTransform]: 'scale(0.6667) translateX(-22px)' },
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
	alignItems: 'center',
	justifyContent: 'space-between',
	transitionDelay: '50ms',
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: TIMING,
	border: 0,
	borderRadius: 999,
	background: 'transparent',
	paddingBlock: 0,
	paddingInlineStart: space.lg,
	paddingInlineEnd: space.md,
	width: '100%',
	textAlign: 'left',
	cursor: 'pointer',
	selectors: {
		'&:hover, &:focus-visible, &[data-popup-open]': {
			transitionDelay: '0ms',
			backgroundColor: vars.palette.contrast_25,
		},
	},
});

export const profileTriggerMinimal = style({
	vars: { [avatarActiveTransform]: 'scale(0.8)' },
	justifyContent: 'center',
	paddingInline: 0,
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
	selectors: {
		[active('&')]: { transform: avatarActiveTransform, transitionDelay: '0ms' },
	},
	'@media': {
		'(prefers-reduced-motion: reduce)': { transition: 'none' },
	},
});

export const identity = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	alignItems: 'start',
	transitionDelay: '50ms',
	transitionDuration: '100ms',
	transitionProperty: 'opacity',
	transitionTimingFunction: TIMING,
	opacity: 0,
	marginLeft: -space.xl,
	selectors: {
		[active('&')]: { transitionDelay: '0ms', opacity: 1 },
	},
});

export const ellipsisIcon = style({
	flexShrink: 0,
	transitionDuration: '100ms',
	transitionProperty: 'opacity',
	transitionTimingFunction: TIMING,
	opacity: 0,
	selectors: {
		[active('&')]: { opacity: 1 },
	},
});

export const navItem = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	transitionTimingFunction: TIMING,
	outlineOffset: -1,
	borderRadius: 999,
	padding: space.md,
	textDecoration: 'none',
	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_25 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -1 },
	},
});

export const iconBox = style({
	display: 'flex',
	position: 'relative',
	flexShrink: 0,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1,
	width: 24,
	height: 24,
});

export const badge = style([navBadge.badge, { top: -6, left: 12 }]);

export const hasNewDot = style([navBadge.hasNewDot, { top: -4, right: -2 }]);

export const composeRow = style({
	display: 'flex',
	flexDirection: 'row',
	paddingTop: space.lg,
	paddingLeft: space.md,
});

export const composeRowMinimal = style({
	display: 'flex',
	paddingTop: space.lg,
});

export const composeButtonMinimal = style({
	padding: 0,
	width: LARGE_ELEMENT_SIZE,
	height: LARGE_ELEMENT_SIZE,
});
