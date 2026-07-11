import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const ratioVar = createVar();

export const outer = style({ width: '100%' });

export const playButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 0,
	bottom: 0,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	margin: 0,
	outline: 0,
	padding: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 2,
});

export const box = style([
	mediaBorder,
	{
		aspectRatio: ratioVar,
		backgroundColor: '#000',
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		position: 'relative',
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
		selectors: {
			[`&:has(${playButton}:focus-visible)`]: {
				outline: `2px solid ${vars.palette.primary_500}`,
				outlineOffset: -2,
			},
		},
	},
]);

export const inset = style({
	bottom: -2,
	left: -2,
	position: 'absolute',
	right: -2,
	top: -2,
});

export const video = style({
	display: 'block',
	height: '100%',
	width: '100%',
});

const dimBase = style({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 1,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});

export const dimInner = style([dimBase, { opacity: 0.2 }]);
export const dimOuter = style([dimBase, { opacity: 0.3 }]);

const badge = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	borderRadius: 6,
	bottom: 6,
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: 3,
	paddingInline: 4,
	position: 'absolute',
	zIndex: 2,
});

export const gifBadge = style([badge, { left: 6 }]);

export const altBadge = style([
	badge,
	{
		appearance: 'none',
		border: 0,
		cursor: 'pointer',
		margin: 0,
		right: 6,
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const badgeText = style({
	color: '#fff',
});
