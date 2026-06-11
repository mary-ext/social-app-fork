import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// a horizontal link-meta card: fixed thumbnail on the left, title + domain on the right.
export const card = style({
	alignItems: 'stretch',
	backgroundColor: vars.palette.contrast_0,
	borderColor: vars.palette.contrast_100,
	borderRadius: 8,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	overflow: 'hidden',
	width: '100%',
});

export const thumb = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	display: 'flex',
	flexDirection: 'column',
	gap: 4,
	justifyContent: 'center',
	minHeight: 64,
	position: 'relative',
	width: 114,
});

export const thumbImage = style({
	height: '100%',
	inset: 0,
	objectFit: 'cover',
	position: 'absolute',
	width: '100%',
});

// the "No image" icon; an SVG `fill` reads this wrapper's `color`.
export const placeholderIcon = style({
	alignItems: 'center',
	color: vars.palette.contrast_400,
	display: 'flex',
});

export const body = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 4,
	justifyContent: 'center',
	// let the clamped title/domain ellipsize instead of forcing the card wider
	minWidth: 0,
	paddingBlock: 8,
	paddingInline: 12,
});

export const domainRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 2,
});

export const globe = style({
	alignItems: 'center',
	color: vars.palette.contrast_400,
	display: 'inline-flex',
});

const skeleton = {
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 6,
} as const;

export const skeletonTitle = style({ ...skeleton, height: 16, width: 128 });
export const skeletonDomain = style({ ...skeleton, height: 12, width: 72 });
