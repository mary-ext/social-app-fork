import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

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

export const dim = style({
	bottom: 0,
	left: 0,
	opacity: 0.2,
	pointerEvents: 'none',
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 1,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});

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

export const altBadgeTopRight = style({
	bottom: 'auto',
	top: 6,
});

export const badgeText = style({
	color: '#fff',
});
