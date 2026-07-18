import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const wrapper = style({
	position: 'relative',
});

export const card = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	transitionDuration: '100ms',
	transitionProperty: 'border-color',
	margin: 0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.sm,
	padding: space.lg,
	paddingTop: 20 + space.md,
	paddingBottom: space.md,
	width: '100%',
	overflow: 'hidden',
	textAlign: 'left',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
		'&:hover': { borderColor: vars.palette.contrast_200 },
		'.theme--light &': { backgroundColor: vars.palette.contrast_0 },
		'.theme--dark &, .theme--dim &': {
			backgroundColor: vars.palette.contrast_25,
		},
	},
});

export const timestamp = style({
	position: 'absolute',
	top: space.md,
	left: space.lg,
	pointerEvents: 'none',
});

export const menuSlot = style({
	position: 'absolute',
	top: space.md,
	right: space.md,
});

export const menuButton = style({
	appearance: 'none',
	display: 'flex',
	position: 'relative',
	alignItems: 'center',
	justifyContent: 'center',
	margin: 0,
	border: 'none',
	borderRadius: borderRadius.full,
	background: 'transparent',
	padding: 0,
	width: 20,
	height: 20,
	color: vars.palette.contrast_400,
	cursor: 'pointer',
	selectors: {
		'&::before': {
			position: 'absolute',
			inset: -4,
			transitionDuration: '100ms',
			transitionProperty: 'background-color',
			borderRadius: borderRadius.full,
			content: '""',
		},
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
		'.theme--light &:hover::before': {
			backgroundColor: vars.palette.contrast_50,
		},
		'.theme--dark &:hover::before, .theme--dim &:hover::before': {
			backgroundColor: vars.palette.contrast_100,
		},
	},
});

export const menuIcon = style({
	display: 'block',
	position: 'relative',
	zIndex: 1,
});

export const metaList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

export const tagRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
});

export const tagInfo = style({
	color: vars.palette.contrast_700,
});

export const tagWarning = style({
	selectors: {
		'.theme--light &': { color: '#C99A00' },
		'.theme--dark &, .theme--dim &': { color: vars.palette.yellow },
	},
});

export const tagText = style({
	color: 'inherit',
});

export const tagIcon = style({
	flexShrink: 0,
});

export const mediaRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	marginInline: -4,
});

export const imageTile = style({
	boxSizing: 'border-box',
	padding: space._2xs,
	width: '20%',
});

export const mediaTile = style({
	boxSizing: 'border-box',
	flex: 1,
	padding: space._2xs,
	maxWidth: 100,
});

export const square = style([
	mediaBorder,
	{
		position: 'relative',
		borderRadius: borderRadius.xs,
		backgroundColor: vars.palette.contrast_25,
		aspectRatio: '1',
		overflow: 'hidden',
	},
]);

export const squareEmpty = style({
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
