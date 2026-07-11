import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const wrapper = style({
	position: 'relative',
});

export const card = style({
	appearance: 'none',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.sm,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	margin: 0,
	overflow: 'hidden',
	padding: space.lg,
	paddingBottom: space.md,
	paddingTop: 20 + space.md,
	textAlign: 'left',
	transitionDuration: '100ms',
	transitionProperty: 'border-color',
	width: '100%',
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
	left: space.lg,
	pointerEvents: 'none',
	position: 'absolute',
	top: space.md,
});

export const menuSlot = style({
	position: 'absolute',
	right: space.md,
	top: space.md,
});

export const menuButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: borderRadius.full,
	color: vars.palette.contrast_400,
	cursor: 'pointer',
	display: 'flex',
	height: 20,
	justifyContent: 'center',
	margin: 0,
	padding: 0,
	position: 'relative',
	width: 20,
	selectors: {
		'&::before': {
			borderRadius: borderRadius.full,
			content: '""',
			inset: -4,
			position: 'absolute',
			transitionDuration: '100ms',
			transitionProperty: 'background-color',
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
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
	maxWidth: 100,
	padding: space._2xs,
});

export const square = style([
	mediaBorder,
	{
		aspectRatio: '1',
		backgroundColor: vars.palette.contrast_25,
		borderRadius: borderRadius.xs,
		overflow: 'hidden',
		position: 'relative',
	},
]);

export const squareEmpty = style({
	backgroundColor: 'black',
});

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

export const overlay = style({
	alignItems: 'center',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	position: 'absolute',
});

export const gifBadge = style({
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	borderRadius: 6,
	bottom: 5,
	left: 5,
	paddingBlock: 3,
	paddingInline: 6,
	position: 'absolute',
	zIndex: 2,
});

export const gifBadgeText = style({
	color: 'white',
	fontSize: 7,
	fontWeight: 600,
	lineHeight: 1,
});
