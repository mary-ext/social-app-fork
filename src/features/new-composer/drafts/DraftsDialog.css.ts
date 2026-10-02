import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { hover } from '#/styles/interaction';
import { mediaBorder } from '#/styles/media-border.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

import { AVATAR_SIZE } from '../shared/layout';

export const placeholder = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	justifyContent: 'center',
	alignItems: 'center',
	padding: space._3xl,
});

export const placeholderIcon = style({
	width: iconSize._3xl,
	height: iconSize._3xl,
	color: colors.textContrastLow,
});

export const row = recipe(
	{
		base: {
			position: 'relative',
		},
		variants: {
			topBorder: {
				false: {},
				true: { borderTop: `1px solid ${colors.borderContrastLow}` },
			},
		},
	},
	{ debugId: 'row' },
);

export const select = style({
	appearance: 'none',
	display: 'flex',
	flexDirection: 'column',
	margin: 0,
	border: 'none',
	background: 'none',
	padding: space.lg,
	width: '100%',
	textAlign: 'start',
	cursor: 'pointer',
	selectors: {
		[hover()]: {
			backgroundColor: colors.contrast_25,
		},
		'&:disabled': {
			cursor: 'default',
		},
		'&:focus-visible': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const post = style({
	display: 'flex',
	gap: space.md,
});

export const rail = style({
	display: 'flex',
	flexShrink: 0,
	flexDirection: 'column',
	gap: space.xs,
	alignItems: 'center',
	width: AVATAR_SIZE,
});

export const line = style({
	flexGrow: 1,
	// a one-line post leaves little room under the avatar.
	minHeight: space.md,
	backgroundColor: colors.contrast_100,
	width: 2,
});

export const content = style({
	display: 'flex',
	flexGrow: 1,
	flexDirection: 'column',
	// keep clear of the options button.
	paddingRight: space._4xl,
	minWidth: 0,
});

// extend the thread line below the post content.
export const threadContent = style({
	paddingBottom: space.md,
});

export const header = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'baseline',
	paddingBottom: space.xs,
	minWidth: 0,
});

export const handle = style({
	flexShrink: 1,
	minWidth: 0,
});

export const time = style({
	flexShrink: 0,
	paddingLeft: space.sm,
});

export const meta = style({
	display: 'flex',
	flexWrap: 'wrap',
	gap: space.xs,
	alignItems: 'center',
	paddingTop: space.sm,
});

export const warning = style({
	flexShrink: 0,
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.negative_500,
});

export const thumbnails = style({
	display: 'flex',
	gap: space.xs,
	paddingTop: space.sm,
});

export const thumbnail = style([
	mediaBorder,
	{
		display: 'grid',
		position: 'relative',
		flexShrink: 0,
		placeItems: 'center',
		borderRadius: borderRadius.sm,
		backgroundColor: colors.contrast_25,
		width: 64,
		height: 64,
		overflow: 'hidden',
		color: colors.textContrastMedium,
	},
]);

export const thumbnailImage = style({
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const thumbnailIcon = style({
	width: iconSize.lg,
	height: iconSize.lg,
});

export const replies = style({
	display: 'flex',
	gap: space.md,
	alignItems: 'center',
	paddingTop: space.xs,
});

export const repliesAvatar = style({
	display: 'grid',
	flexShrink: 0,
	placeItems: 'center',
	width: AVATAR_SIZE,
});

export const options = style({
	position: 'absolute',
	top: space.md,
	right: space.md,
});
