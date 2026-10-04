import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { recipe } from '#/styles/recipe';
import { fontWeight, space } from '#/styles/tokens.css';

import { overlay, overlayIcon, OVERLAY_SIZE, roundButton } from '../../shared/overlay.css';
import { revealOnHover } from '../../shared/reveal.css';

// #region shared

const badge = style({
	display: 'flex',
	alignItems: 'center',
	boxSizing: 'border-box',
	borderRadius: 999,
	height: OVERLAY_SIZE,
	fontSize: 12,
	fontWeight: fontWeight.semiBold,
	lineHeight: 1,
});

const inlineBadge = style({
	// prevent grid stretch in voice tiles.
	width: 'fit-content',
	color: vars.palette.contrast_700,
});

const inlineControl = style({
	backgroundColor: 'transparent',
	selectors: {
		[hover(':not(:disabled)')]: { backgroundColor: vars.palette.contrast_100 },
		'&:disabled': { opacity: 0.5, cursor: 'default' },
	},
});

// #endregion

export const badges = style({
	display: 'flex',
	position: 'absolute',
	bottom: space.sm,
	left: space.sm,
	gap: 6,
});

export const status = style({
	display: 'flex',
	position: 'absolute',
	top: space.sm,
	left: space.sm,
});

export const chip = recipe(
	{
		base: [badge, { gap: space.xs, padding: '0 11px 0 8px' }],
		defaultVariants: {
			variant: 'overlay',
		},
		variants: {
			variant: {
				inline: [inlineBadge, inlineControl],
				overlay: [overlay],
			},
		},
	},
	{ debugId: 'chip' },
);

export const icon = style([overlayIcon]);

export const chipCheck = style({
	color: vars.palette.positive_500,
});

export const chipWarning = style({
	color: vars.palette.negative_500,
});

export const uploadBadge = recipe(
	{
		base: [badge, { gap: 6, padding: '0 11px 0 5px', fontVariantNumeric: 'tabular-nums' }],
		defaultVariants: {
			variant: 'overlay',
		},
		variants: {
			variant: {
				inline: [inlineBadge],
				overlay: [overlay],
			},
		},
	},
	{ debugId: 'uploadBadge' },
);

export const button = recipe(
	{
		base: [roundButton],
		defaultVariants: {
			variant: 'overlay',
		},
		variants: {
			variant: {
				inline: [inlineControl, { color: vars.palette.contrast_700 }],
				overlay: [overlay],
			},
		},
	},
	{ debugId: 'button' },
);

export const actions = recipe(
	{
		base: [revealOnHover, { display: 'flex', gap: 6 }],
		defaultVariants: {
			variant: 'overlay',
		},
		variants: {
			variant: {
				inline: {},
				overlay: {
					position: 'absolute',
					top: space.sm,
					right: space.sm,
				},
			},
		},
	},
	{ debugId: 'actions' },
);
