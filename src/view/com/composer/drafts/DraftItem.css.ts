import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const wrapper = style({
	position: 'relative',
});

// the whole card is the press target; the menu button + timestamp overlay it as absolute siblings, so the
// extra top padding reserves room for them.
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
		// the hover halo extends past the small icon box, matching the RNW inset.
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
	display: 'flex',
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

// inherit the row color set by tagInfo/tagWarning instead of the Text recipe's own color.
export const tagText = style({
	color: 'inherit',
});

export const tagIcon = style({
	display: 'flex',
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

// gif/video tiles aren't gridded into fifths; they sit at their natural ~100px square.
export const mediaTile = style({
	boxSizing: 'border-box',
	flex: 1,
	maxWidth: 100,
	padding: space._2xs,
});

export const square = style({
	aspectRatio: '1',
	backgroundColor: vars.palette.contrast_25,
	borderRadius: borderRadius.xs,
	overflow: 'hidden',
	position: 'relative',
});

export const squareEmpty = style({
	backgroundColor: 'black',
});

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

// the shared inset border defaults to the 12px media radius; these small tiles round at 4px.
export const insetRadius = style({ borderRadius: borderRadius.xs });

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
