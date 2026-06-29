import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space, zIndex } from '#/styles/tokens.css';

// sit above dialogs and menus so a card anchored to a trigger inside either still shows,
// and clamp to the space Base UI measures so a tall/wide card can't overflow the viewport
export const positioner = style({
	maxHeight: 'var(--available-height)',
	maxWidth: 'var(--available-width)',
	zIndex: zIndex.tooltip,
});

// the positioning/animation layer only; the visual chrome lives on the card so its fixed width is the full
// card width (border included).
export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	maxWidth: '100%',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	overflow: 'hidden',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.97)' },
	},
});

const baseCard = style({
	display: 'flex',
	flexDirection: 'column',
	boxSizing: 'border-box',
});

export const liveCard = style([
	baseCard,
	{
		width: 350,
	},
]);

export const profileCard = style([
	baseCard,
	{
		padding: space.lg,
		width: 300,
	},
]);

export const loadingCard = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: 200,
	width: 300,
});

export const headerRow = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
});

export const avatarLink = style({
	alignSelf: 'flex-start',
	display: 'inline-flex',
});

export const nameLink = style({
	display: 'flex',
	flexDirection: 'column',
	// the spacing that the inlined name row used to carry: above the name, between name and handle, below
	gap: space.xs,
	paddingBottom: space.sm,
	paddingTop: space.md,
	textDecoration: 'none',
});

export const statsRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.md,
	paddingTop: space.xs,
});

export const pills = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.xs,
});

export const description = style({
	paddingTop: space.md,
});

export const knownFollowers = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	paddingTop: space.md,
});
