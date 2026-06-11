import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

// sit above dialogs (zIndex 10) and menus (11) so a card anchored to a trigger inside either still shows,
// and clamp to the space Base UI measures so a tall/wide card can't overflow the viewport
export const positioner = style({
	maxHeight: 'var(--available-height)',
	maxWidth: 'var(--available-width)',
	zIndex: 12,
});

// the positioning/animation layer only; the visual chrome lives on the card so its fixed width is the full
// card width (border included).
export const popup = style({
	maxWidth: '100%',
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.97)' },
	},
});

// a live card is roomier; a normal card pads its own content, while a live card's media bleeds to the card
// edges so its padding lives inside LiveStatus instead. `border-box` keeps the border within the fixed width.
export const card = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	boxSizing: 'border-box',
	maxWidth: '100%',
	// clip the live card's bleed-to-edge media to the rounded corners
	overflow: 'hidden',
	width: 300,
});

export const cardLive = style({
	width: 350,
});

export const cardPadded = style({
	padding: space.lg,
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: 200,
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
	paddingBottom: space.sm,
	textDecoration: 'none',
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	paddingBottom: space.xs,
	paddingTop: space.md,
});

export const badges = style({
	marginTop: -1,
	paddingLeft: space.xs,
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
