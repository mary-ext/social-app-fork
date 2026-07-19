import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
});

export const tile = style([
	mediaBorder,
	{
		position: 'relative',
		flexGrow: 1,
		maxWidth: 100,
		aspectRatio: '1',
		borderRadius: borderRadius.xs,
		backgroundColor: vars.palette.contrast_25,
		overflow: 'hidden',
	},
]);

export const tileEmpty = style({
	backgroundColor: 'black',
});

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const overlay = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
});

export const gifBadge = style({
	position: 'absolute',
	bottom: 5,
	left: 5,
	zIndex: 2,
	borderRadius: 6,
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	paddingBlock: 3,
	paddingInline: 6,
});

export const gifBadgeText = style({
	lineHeight: 1,
	color: 'white',
	fontSize: 7,
	fontWeight: 600,
});
