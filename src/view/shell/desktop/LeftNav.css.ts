import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

import {
	LARGE_ELEMENT_SIZE,
	LEFT_NAV_MINIMAL_WIDTH,
	LEFT_NAV_PWI_WIDTH,
	LEFT_NAV_STANDARD_WIDTH,
} from './LeftNav.const';

const TIMING = 'cubic-bezier(0.17, 0.73, 0.14, 1)';

// #region nav root

// the rail itself: a fixed-width column. `border-box` keeps the padding inside the declared width so the
// grid track it sits in matches these widths exactly.
export const root = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	padding: space.lg,
	width: LEFT_NAV_STANDARD_WIDTH,
});

// the logged-out rail is a touch wider to fit the sign-in card.
export const rootPwi = style({
	width: LEFT_NAV_PWI_WIDTH,
});

// the minimal rail (Messages routes / narrow viewports) collapses to icon-only and centers its column.
export const rootMinimal = style({
	alignItems: 'center',
	overflowX: 'hidden',
	width: LEFT_NAV_MINIMAL_WIDTH,
});

// wraps the logged-out sign-in card, spacing it below the top of the rail.
export const signInWrap = style({
	paddingTop: space.xl,
});

// #endregion

// #region profile switcher

// the transform the avatar adopts while the trigger is active; the minimal rail overrides it to scale in place
// without the sideways slide, since there is no name to reveal beside it.
const avatarActiveTransform = createVar();

export const profileCard = style({
	display: 'flex',
	flexDirection: 'column',
	paddingBottom: space.md,
});

// the full-width rail left-aligns the switcher pill and the loading placeholder.
export const profileCardFull = style({
	alignItems: 'flex-start',
	width: '100%',
});

// stand-in shown while the profile query loads, sized to the resting avatar.
export const avatarPlaceholder = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 999,
	height: LARGE_ELEMENT_SIZE,
	width: LARGE_ELEMENT_SIZE,
});

// in the full rail the placeholder lines up with the avatar's resting inset.
export const avatarPlaceholderInset = style({
	marginLeft: space.lg,
});

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

// #endregion

// #region nav item

// a nav link pill: icon (+ label in the full rail), filling on hover.
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

// fixed icon slot; the 28px icon overflows it centered. `flex-shrink: 0` keeps it square next to a long label.
export const iconBox = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	position: 'relative',
	width: 24,
	// sits above the label so the count badge, which reaches into the label, paints over it.
	zIndex: 1,
});

// unread-count badge overlapping the icon's top-right — a circle for a single digit, stretching to a pill for
// wider counts. flex-centering the digit keeps it on the badge's axis without a hand-tuned line-height.
export const badge = style({
	alignItems: 'center',
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	height: 18,
	justifyContent: 'center',
	left: 12,
	minWidth: 18,
	paddingInline: 6,
	position: 'absolute',
	top: -6,
});

// the "has new" dot, shown in place of a count.
export const hasNewDot = style({
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	height: 8,
	position: 'absolute',
	right: -2,
	top: -4,
	width: 8,
});

// #endregion

// #region compose button

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

// a square icon-only compose button for the minimal rail.
export const composeButtonMinimal = style({
	height: LARGE_ELEMENT_SIZE,
	padding: 0,
	width: LARGE_ELEMENT_SIZE,
});

// #endregion
