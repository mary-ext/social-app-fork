import { createVar, style } from '@vanilla-extract/css';

import * as navBadge from '#/view/shell/nav-badge.css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { space, zIndex } from '#/styles/tokens.css';

const swipeEase = 'cubic-bezier(0.32, 0.72, 0, 1)';

export const portal = style(
	layered(components, {
		zIndex: zIndex.modal,
	}),
);

export const backdrop = style(
	layered(components, {
		position: 'fixed',
		inset: 0,
		transitionDuration: '450ms',
		transitionProperty: 'opacity',
		transitionTimingFunction: swipeEase,
		opacity: 'calc(1 - var(--drawer-swipe-progress))',
		minHeight: '100dvh',
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

export const viewport = style(
	layered(components, {
		display: 'flex',
		position: 'fixed',
		inset: 0,
	}),
);

const bleed = createVar();

export const popup = style(
	layered(components, {
		vars: { [bleed]: '48px' },
		boxSizing: 'border-box',
		display: 'flex',
		flexDirection: 'column',
		transform: 'translateX(var(--drawer-swipe-movement-x))',
		transition: `transform 450ms ${swipeEase}`,
		marginLeft: `calc(-1 * ${bleed})`,
		outline: 0,
		borderRight: `1px solid ${vars.palette.contrast_100}`,
		backgroundColor: vars.palette.contrast_0,
		paddingLeft: bleed,
		width: `calc(330px + ${bleed})`,
		maxWidth: `calc(80% + ${bleed})`,
		height: '100%',
		overflowY: 'auto',
		overscrollBehavior: 'contain',
		touchAction: 'auto',
		willChange: 'transform',
		selectors: {
			'&[data-starting-style], &[data-ending-style]': {
				transform: `translateX(calc(-100% + ${bleed} - 2px))`,
			},
			'&[data-ending-style]': { transitionDuration: 'calc(var(--drawer-swipe-strength) * 400ms)' },
		},
	}),
);

export const content = style(
	layered(components, {
		paddingTop: `max(env(safe-area-inset-top), ${space.xl}px)`,
		paddingBottom: space.xl,
		width: '100%',
	}),
);

export const srOnly = style({
	position: 'absolute',
	margin: -1,
	border: 0,
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	padding: 0,
	width: 1,
	height: 1,
	overflow: 'hidden',
	whiteSpace: 'nowrap',
});

export const profileCard = style(
	layered(components, {
		appearance: 'none',
		display: 'flex',
		flexDirection: 'column',
		gap: space.sm,
		border: 0,
		background: 'none',
		paddingBlock: 0,
		paddingInline: space.xl,
		width: '100%',
		textAlign: 'left',
		color: 'inherit',
		cursor: 'pointer',
	}),
);

export const profileNameRow = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
});

export const signInCard = style({ paddingInline: space.xl });

export const dividerTop = style({
	marginTop: space.xl,
	marginBottom: space.sm,
	marginInline: space.xl,
	backgroundColor: vars.palette.contrast_100,
	height: 1,
});

export const menuItem = style(
	layered(components, {
		appearance: 'none',
		display: 'flex',
		gap: space.md,
		alignItems: 'center',
		border: 0,
		background: 'none',
		paddingBlock: space.md,
		paddingInline: space.xl,
		width: '100%',
		textAlign: 'left',
		color: vars.palette.contrast_1000,
		cursor: 'pointer',
		selectors: {
			'&:hover, &:focus-visible': { backgroundColor: vars.palette.contrast_25 },
			'&:focus-visible': { outline: 'none' },
		},
	}),
);

export const iconWrap = style({ display: 'inline-flex', position: 'relative' });

export const countBadge = style([navBadge.badge, { top: -4, right: -10 }]);
