import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { vars } from '#/styles/contract.css';
import { sprinkles } from '#/styles/sprinkles.css';
import { borderRadius, space } from '#/styles/tokens.css';

// matches the RNW `transition_color` atom (border/color hover swaps on the card).
const transition = {
	transitionDuration: '100ms',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
} as const;

export const wrapper = sprinkles({ marginTop: 'sm' });

export const card = style({
	...transition,
	borderColor: vars.palette.contrast_100,
	borderRadius: `${borderRadius.md}px`,
	borderStyle: 'solid',
	borderWidth: '1px',
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
	transitionProperty: 'border-color',
	width: '100%',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
	},
});

export const thumb = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	display: 'block',
	objectFit: 'cover',
	width: '100%',
});

export const body = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	gap: '3px',
	paddingTop: `${space.sm}px`,
});

/** Top border separating the body from the thumbnail; tracks the card's hover state. */
export const bodyWithMedia = style({
	...transition,
	borderTopColor: vars.palette.contrast_100,
	borderTopStyle: 'solid',
	borderTopWidth: '1px',
	transitionProperty: 'border-color',
	selectors: {
		[`${card}:hover &`]: { borderTopColor: vars.palette.contrast_300 },
	},
});

export const titleBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '3px',
	paddingBottom: `${space.xs}px`,
	paddingLeft: `${space.md}px`,
	paddingRight: `${space.md}px`,
});

export const domainWrap = style({
	paddingLeft: `${space.md}px`,
	paddingRight: `${space.md}px`,
});

export const divider = style({
	borderTopColor: vars.palette.contrast_100,
	borderTopStyle: 'solid',
	borderTopWidth: '1px',
	width: '100%',
});

export const domainRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: `${space._2xs}px`,
	paddingBottom: `${space.sm}px`,
	// off the divider; a hair more than the symmetric `pb_sm` below it (matches the RNW card).
	paddingTop: '6px',
});

export const globe = style({
	...transition,
	color: vars.palette.contrast_400,
	display: 'inline-flex',
	transitionProperty: 'color',
	selectors: {
		[`${card}:hover &`]: { color: vars.palette.contrast_700 },
	},
});

// `&&` outranks the `Text` component's own single-class `color` sprinkle.
export const domain = style({
	...transition,
	transitionProperty: 'color',
	selectors: {
		'&&': { color: vars.palette.contrast_700 },
		[`${card}:hover &&`]: { color: vars.palette.contrast_900 },
	},
});
