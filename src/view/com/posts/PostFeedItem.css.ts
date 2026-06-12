import { style } from '@vanilla-extract/css';

import { colorMix } from '#/styles/color-mix';
import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';

/**
 * The feed post row; GalleryBleed measures this host and clips the image-carousel bleed to it. The top border
 * and reclaimed padding vary by the slice's position in the thread, so they're recipe variants the component
 * toggles per render.
 */
export const outer = recipe({
	base: {
		borderTopColor: vars.palette.contrast_100,
		borderTopStyle: 'solid',
		borderTopWidth: 0,
		boxSizing: 'border-box',
		cursor: 'pointer',
		display: 'flex',
		flexDirection: 'column',
		paddingLeft: 10,
		paddingRight: 15,
		selectors: {
			'&:hover': {
				backgroundColor: colorMix(colors.contrast_50, vars.opacity.hover),
			},
		},
	},
	variants: {
		// trailing space below a thread's last child, and below standalone posts
		bottomSpace: { true: { paddingBottom: 8 } },
		// the feed's first post hides its top border (the sticky header already separates it), so reclaim the
		// removed hairline as padding to keep content from shifting up 1px
		reclaimBorder: { true: { paddingTop: 1 } },
		topBorder: { true: { borderTopWidth: 1 } },
	},
});

/** The repost/pin reason header row above the post; aligns the reason text with the post body. */
export const reasonRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 10,
	paddingLeft: 8,
});

/** Fixed-width slot above the avatar that carries the thread reply-spine up to the parent. */
export const spineSlot = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	width: 42,
});

/** The reason content beside the spine slot. */
export const reason = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 1,
	minWidth: 0,
	paddingTop: 8,
});

/** The thread reply-spine: a 2px vertical bar centered in the avatar column. */
export const replyLine = style({
	backgroundColor: vars.palette.contrast_100,
	flexGrow: 1,
	marginLeft: 'auto',
	marginRight: 'auto',
	width: 2,
	selectors: {
		'.theme--dark &, .theme--dim &': {
			backgroundColor: vars.palette.contrast_200,
		},
	},
});

/** Extra gap below the spine segment that sits above the avatar (in the reason row). */
export const replyLineTop = style({
	marginBottom: 4,
});

/** The feed's 1px nudge between the reason row and the avatar/content row. */
export const layoutRow = style({
	marginTop: 1,
});

/** The feed surface's trailing space below the embed, before the controls. */
export const embedSpacing = style({
	paddingBottom: 4,
});
