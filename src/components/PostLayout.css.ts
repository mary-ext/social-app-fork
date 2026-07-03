import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

import { OUTER_SPACE, REPLY_LINE_WIDTH } from './PostLayout.const';

/**
 * the outer post row shared by every surface. anchors in-row overlays and is measured by GalleryBleed to clip
 * the image-carousel bleed.
 */
export const frame = recipe(
	{
		base: {
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			paddingInline: OUTER_SPACE,
			position: 'relative',
		},
		variants: {
			// whole-row hover tint; the focused anchor post opts out
			hoverable: {
				true: {
					cursor: 'pointer',
					selectors: {
						'&:hover': {
							backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
						},
					},
				},
			},
			// extra top room when the post is the thread root
			rootPad: { true: { paddingTop: space.lg } },
			topBorder: {
				true: {
					borderTopColor: colors.borderContrastLow,
					borderTopStyle: 'solid',
					borderTopWidth: 1,
				},
			},
		},
	},
	{ debugId: 'frame' },
);

/**
 * The avatar + content columns side by side. `gap` owns the avatar→content spacing; `position: relative`
 * anchors the feed's absolutely-positioned `DiscoverDebug` overlay.
 */
export const row = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	position: 'relative',
});

/** The avatar column; centers the avatar and any reply-spine, and never shrinks on a crowded row. */
export const avatarColumn = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
});

/**
 * flex-1 content column. `minWidth: 0` allows text to ellipsize instead of overflowing. reserves bottom
 * padding for per-post spacing.
 */
export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
	paddingBottom: space.md,
});

/**
 * a centered 2px vertical bar that grows to fill its column. brightens one contrast step in dark/dim themes
 * to stay legible.
 */
export const spine = style({
	backgroundColor: colors.borderContrastLow,
	flexGrow: 1,
	marginInline: 'auto',
	width: REPLY_LINE_WIDTH,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: colors.borderContrastMedium,
		},
	},
});
