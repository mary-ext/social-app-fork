import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

const TIMING = 'cubic-bezier(0.17, 0.73, 0.14, 1)';

// the transform the avatar adopts while the trigger is active; the minimal rail overrides it to scale in place
// without the sideways slide, since there is no name to reveal beside it.
const avatarActiveTransform = createVar();

// the profile switcher: a full-width pill that, while hovered/focused or with its menu open, shrinks the
// avatar aside to reveal the account name and the overflow affordance.
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

// the trigger's three active-state selectors, applied to a descendant `child` (`&` for the element itself).
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

// name + handle, hidden until the trigger is active; the negative margin tucks it under the resting avatar so
// it slides out from behind as the avatar shrinks.
export const identity = style({
	flex: 1,
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
