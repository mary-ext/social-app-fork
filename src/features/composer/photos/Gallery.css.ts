import { createVar, style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

const scrim = 'rgba(0, 0, 0, 0.75)';

export const root = style({
	width: '100%',
	overflow: 'visible',
});

export const scroll = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	gap: ITEM_GAP,
	overflowX: 'scroll',
	overflowY: 'hidden',
	overscrollBehaviorX: 'contain',
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

export const item = style([
	mediaBorder,
	{
		position: 'relative',
		flex: '0 0 auto',
		borderRadius: borderRadius.md,
		background: vars.palette.contrast_25,
		overflow: 'hidden',
	},
]);

export const ratioVar = createVar();

export const single = style([
	mediaBorder,
	{
		position: 'relative',
		borderRadius: borderRadius.md,
		background: vars.palette.contrast_25,
		aspectRatio: ratioVar,
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
		overflow: 'hidden',
	},
]);

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

const controlBase = style({
	appearance: 'none',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	margin: 0,
	border: 'none',
	background: scrim,
	color: colors.white,
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const controls = style({
	display: 'flex',
	position: 'absolute',
	top: space.sm,
	right: space.sm,
	flexDirection: 'row',
	gap: space.sm,
	zIndex: 1,
});

export const control = style([
	controlBase,
	{
		borderRadius: borderRadius.full,
		padding: 0,
		width: 28,
		height: 28,
	},
]);

export const altBadge = style([
	controlBase,
	{
		position: 'absolute',
		bottom: space.sm,
		left: space.sm,
		flexDirection: 'row',
		gap: space.xs,
		zIndex: 1,
		borderRadius: 6,
		paddingBlock: 3,
		paddingInline: space.sm,
	},
]);

export const altBadgeLabel = style({ letterSpacing: 1 });

export const reminder = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const reminderIcon = style({
	marginBlock: (20 - 18) / 2,
});

export const reminderText = style({
	flex: 1,
	minWidth: 0,
});
