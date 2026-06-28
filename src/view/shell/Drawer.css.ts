import { createVar, style } from '@vanilla-extract/css';

import * as navBadge from '#/view/shell/nav-badge.css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { space, zIndex } from '#/styles/tokens.css';

// the entrance/exit translate and the swipe-driven backdrop fade mirror Base UI's `hero` side-drawer demo,
// reflected to the left edge: the popup slides out to `translateX(-100%)`, and `--drawer-swipe-*` (set by
// Base UI during a drag) drive a live transform + backdrop fade. `data-swiping` cuts the transition so the
// drawer tracks the finger 1:1; `data-ending-style` stretches the duration by the fling strength.
const swipeEase = 'cubic-bezier(0.32, 0.72, 0, 1)';

export const backdrop = style(
	layered(components, {
		// the subtle per-theme tint carries its own low alpha; the swipe formula only fades it out on dismiss.
		inset: 0,
		minHeight: '100dvh',
		opacity: 'calc(1 - var(--drawer-swipe-progress))',
		position: 'fixed',
		transitionDuration: '450ms',
		transitionProperty: 'opacity',
		transitionTimingFunction: swipeEase,
		zIndex: zIndex.dialog,
		selectors: {
			'.theme--light &': { backgroundColor: 'rgba(0, 57, 117, 0.1)' },
			'.theme--dark &': { backgroundColor: 'rgba(1, 82, 168, 0.1)' },
			'.theme--dim &': { backgroundColor: 'rgba(10, 13, 16, 0.8)' },
			'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
			'&[data-swiping]': { transitionDuration: '0ms' },
			'&[data-ending-style]': { transitionDuration: 'calc(var(--drawer-swipe-strength) * 400ms)' },
		},
	}),
);

// the fixed flex container; default `flex-start` anchors the popup to the left edge.
export const viewport = style(
	layered(components, {
		display: 'flex',
		inset: 0,
		position: 'fixed',
		zIndex: zIndex.dialog,
	}),
);

// `bleed` extends the panel past its left edge, painted with the drawer background and tucked off-screen by an
// equal negative margin. when the open drawer is rubber-banded rightward (an overpull against the left
// swipe-dismiss direction), the revealed strip is this drawer-bg bleed rather than an empty gap onto the
// backdrop. `width`/`maxWidth` add `bleed` on top of the 330px (≤80vw) visible panel since `box-sizing` is
// `border-box` and `padding-left: bleed` reserves the off-screen region. mirrors Base UI's hero side-drawer.
const bleed = createVar();

export const popup = style(
	layered(components, {
		backgroundColor: vars.palette.contrast_0,
		borderRight: `1px solid ${vars.palette.contrast_100}`,
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		marginLeft: `calc(-1 * ${bleed})`,
		maxWidth: `calc(80% + ${bleed})`,
		outline: 0,
		overflowY: 'auto',
		overscrollBehavior: 'contain',
		paddingLeft: bleed,
		touchAction: 'auto',
		transform: 'translateX(var(--drawer-swipe-movement-x))',
		transition: `transform 450ms ${swipeEase}`,
		vars: { [bleed]: '48px' },
		width: `calc(330px + ${bleed})`,
		willChange: 'transform',
		selectors: {
			'&[data-starting-style], &[data-ending-style]': {
				transform: `translateX(calc(-100% + ${bleed} - 2px))`,
			},
			'&[data-ending-style]': { transitionDuration: 'calc(var(--drawer-swipe-strength) * 400ms)' },
		},
	}),
);

// scroll + padding live on the popup; `Drawer.Content` is a plain wrapper. the top inset clears the mobile
// status bar / notch when the page is installed as a PWA.
export const content = style(
	layered(components, {
		paddingBottom: space.xl,
		paddingTop: `max(env(safe-area-inset-top), ${space.xl}px)`,
		width: '100%',
	}),
);

/** Visually-hidden accessible title for the drawer landmark. */
export const srOnly = style({
	border: 0,
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	height: 1,
	margin: -1,
	overflow: 'hidden',
	padding: 0,
	position: 'absolute',
	whiteSpace: 'nowrap',
	width: 1,
});

export const profileCard = style(
	layered(components, {
		appearance: 'none',
		background: 'none',
		border: 0,
		color: 'inherit',
		cursor: 'pointer',
		display: 'flex',
		flexDirection: 'column',
		gap: space.sm,
		paddingBlock: 0,
		paddingInline: space.xl,
		textAlign: 'left',
		width: '100%',
	}),
);

export const profileNameRow = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
});

export const signInCard = style({ paddingInline: space.xl });

// the dividers are deliberately asymmetric: the small margin faces the nav list, whose buttons carry their
// own `space.md` block padding — so the line sits `sm + md` from the first/last icon, matching the `xl` gap
// on the profile-card/extra-links side.
export const dividerTop = style({
	backgroundColor: vars.palette.contrast_100,
	height: 1,
	marginBottom: space.sm,
	marginInline: space.xl,
	marginTop: space.xl,
});

export const menuItem = style(
	layered(components, {
		alignItems: 'center',
		appearance: 'none',
		background: 'none',
		border: 0,
		color: vars.palette.contrast_1000,
		cursor: 'pointer',
		display: 'flex',
		gap: space.md,
		paddingBlock: space.md,
		paddingInline: space.xl,
		textAlign: 'left',
		width: '100%',
		selectors: {
			'&:hover, &:focus-visible': { backgroundColor: vars.palette.contrast_25 },
			'&:focus-visible': { outline: 'none' },
		},
	}),
);

/** Wraps the icon so the unread count can pin to its corner. */
export const iconWrap = style({ display: 'inline-flex', position: 'relative' });

export const countBadge = style([navBadge.badge, { right: -10, top: -4 }]);
