import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

/**
 * The "view full thread" affordance below a truncated thread slice. `paddingLeft` + the spine slot align the
 * dotted spine with the feed post's reply-line (centered in its 36px avatar column).
 */
export const link = style({
	alignItems: 'center',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	paddingLeft: 16,
	textDecoration: 'none',
	selectors: {
		'&:hover': {
			backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
		},
	},
});

/** Fixed-width slot carrying the dashed spine, centered like the avatar column above it. */
export const spine = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	gap: 4,
	width: 36,
});

/** A solid spine segment; matches the reply-line, which lightens a step in dark/dim. */
export const segment = style({
	backgroundColor: vars.palette.contrast_100,
	height: 7,
	width: 2,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: vars.palette.contrast_200,
		},
	},
});

/** A spine dash between the two solid segments. */
export const dash = style({
	backgroundColor: vars.palette.contrast_200,
	height: 2,
	width: 2,
});
