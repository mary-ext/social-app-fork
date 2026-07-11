import { createVar, style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

const scrim = 'rgba(0, 0, 0, 0.75)';

export const root = style({
	overflow: 'visible',
	width: '100%',
});

export const scroll = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	overscrollBehaviorX: 'contain',
	overflowX: 'scroll',
	overflowY: 'hidden',
	position: 'relative',
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

export const item = style([
	mediaBorder,
	{
		background: vars.palette.contrast_25,
		borderRadius: borderRadius.md,
		flex: '0 0 auto',
		overflow: 'hidden',
		position: 'relative',
	},
]);

export const ratioVar = createVar();

export const single = style([
	mediaBorder,
	{
		aspectRatio: ratioVar,
		background: vars.palette.contrast_25,
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		position: 'relative',
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
	},
]);

export const image = style({
	display: 'block',
	height: '100%',
	objectFit: 'cover',
	width: '100%',
});

const controlBase = style({
	alignItems: 'center',
	appearance: 'none',
	background: scrim,
	border: 'none',
	color: colors.white,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	margin: 0,
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
	},
});

export const controls = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	position: 'absolute',
	right: space.sm,
	top: space.sm,
	zIndex: 1,
});

export const control = style([
	controlBase,
	{
		borderRadius: borderRadius.full,
		height: 28,
		padding: 0,
		width: 28,
	},
]);

export const altBadge = style([
	controlBase,
	{
		borderRadius: 6,
		bottom: space.sm,
		flexDirection: 'row',
		gap: space.xs,
		left: space.sm,
		paddingBlock: 3,
		paddingInline: space.sm,
		position: 'absolute',
		zIndex: 1,
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
