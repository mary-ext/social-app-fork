import { createVar, style } from '@vanilla-extract/css';

import { ITEM_GAP } from '#/components/ImageEmbed/carousel/const';
import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

/** Fixed dark scrim the ALT/edit/remove controls float on, independent of the theme. */
const scrim = 'rgba(0, 0, 0, 0.75)';

/** Measurement anchor at the text-column position: its offset within the bleed drives the overflow inset. */
export const root = style({
	overflow: 'visible',
	width: '100%',
});

/** Horizontal scroll viewport. Margin / padding are inline (they depend on the measured bleed). */
export const scroll = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: ITEM_GAP,
	// prevent horizontal trackpad/wheel swipes from triggering the browser's back/forward overscroll gesture
	// (chrome/firefox; safari is handled via the wheel listener in carousel/usePointerHandlers.ts)
	overscrollBehaviorX: 'contain',
	overflowX: 'scroll',
	overflowY: 'hidden',
	position: 'relative',
	// hide the scrollbar (paging is gesture/keyboard driven)
	scrollbarWidth: 'none',
	selectors: {
		'&::-webkit-scrollbar': { display: 'none' },
	},
});

/** A single image tile. Size is inline (derived from the row height and the image's aspect ratio). */
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

/** Aspect ratio (width / height) of a lone tile, driving its shape and width cap. */
export const ratioVar = createVar();

/** a lone image tile capped at {@link MAX_MEDIA_HEIGHT} tall, mirroring the read-only single-image embed. */
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

/** Top-right cluster holding the edit and remove buttons. */
export const controls = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	position: 'absolute',
	right: space.sm,
	top: space.sm,
	zIndex: 1,
});

/** A circular edit/remove button. */
export const control = style([
	controlBase,
	{
		borderRadius: borderRadius.full,
		height: 28,
		padding: 0,
		width: 28,
	},
]);

/** Bottom-left ALT badge — a pill button opening the alt-text dialog. */
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
