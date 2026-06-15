import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

export const link = style({
	alignItems: 'flex-start',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	textDecoration: 'none',
});

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
	width: '100%',
});

export const header = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	width: '100%',
});

// the name/byline stack; min-width:0 lets the clamped text shrink inside the flex row instead of overflowing.
export const titleColumn = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

// the OG-image embed variant's anchor: a bordered card whose border lightens on hover, matching the sibling
// external-link embed. inset focus ring so the post body's `GalleryBleed` clip can't trim it.
export const embedCard = style({
	backgroundColor: colors.bg,
	borderColor: vars.palette.contrast_100,
	borderRadius: 8,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	overflow: 'hidden',
	transitionProperty: 'border-color',
	width: '100%',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
		'&:hover': { borderColor: vars.palette.contrast_300 },
	},
});

export const embedImage = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	display: 'block',
	objectFit: 'cover',
	width: '100%',
});

export const embedBody = style({
	boxSizing: 'border-box',
	padding: 12,
	width: '100%',
});
