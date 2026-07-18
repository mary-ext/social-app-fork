import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const playButton = style({
	appearance: 'none',
	display: 'flex',
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 2,
	margin: 0,
	outline: 0,
	border: 0,
	background: 'transparent',
	padding: 0,
	cursor: 'pointer',
});

export const dim = style({
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	opacity: 0.2,
	zIndex: 1,
	pointerEvents: 'none',
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});

const badge = style({
	display: 'flex',
	position: 'absolute',
	bottom: 6,
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 2,
	borderRadius: 6,
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	paddingBlock: 3,
	paddingInline: 4,
});

export const gifBadge = style([badge, { left: 6 }]);

export const altBadge = style([
	badge,
	{
		appearance: 'none',
		right: 6,
		margin: 0,
		border: 0,
		cursor: 'pointer',
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	},
]);

export const altBadgeTopRight = style({
	top: 6,
	bottom: 'auto',
});

export const badgeText = style({
	color: '#fff',
});
