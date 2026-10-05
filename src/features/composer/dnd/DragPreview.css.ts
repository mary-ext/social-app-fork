import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, fontSize, fontWeight, space } from '#/styles/tokens.css';

// leaves room for the shadow; native drag images are clipped to the element's box.
export const frame = style({
	padding: space.md,
});

const card = style({
	boxSizing: 'border-box',
	border: `1px solid ${vars.palette.contrast_100}`,
	boxShadow: vars.shadow.md,
	backgroundColor: vars.palette.contrast_0,
	color: vars.palette.contrast_1000,
});

export const chip = style([
	card,
	{
		display: 'flex',
		alignItems: 'center',
		gap: space.sm,
		borderRadius: borderRadius.full,
		padding: `${space.xs}px ${space.md}px ${space.xs}px ${space.xs}px`,
		maxWidth: 280,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semiBold,
	},
]);

export const chipIcon = style({
	display: 'grid',
	flexShrink: 0,
	placeItems: 'center',
	borderRadius: '50%',
	width: 28,
	height: 28,
	objectFit: 'cover',
	backgroundColor: vars.palette.contrast_50,
	color: vars.palette.contrast_700,
});

export const chipText = style({
	overflow: 'hidden',
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
});

export const thumbnail = style([
	card,
	{
		display: 'block',
		borderRadius: borderRadius.sm,
		width: 72,
		height: 72,
		objectFit: 'cover',
	},
]);
