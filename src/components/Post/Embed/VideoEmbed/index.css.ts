import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

/** `paddingTop` percentage driving the bounding-box height (1:1 max). */
export const padVar = createVar();
/** `url(...)` of the video thumbnail, painted as the box background while loading. */
export const thumbVar = createVar();

export const root = style({ paddingTop: space.xs });

export const viewport = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
});

export const sizer = style({ width: '100%' });

export const sizerInner = style({
	overflow: 'hidden',
	paddingTop: padVar,
	position: 'relative',
});

export const abs = style({
	bottom: 0,
	display: 'flex',
	flexDirection: 'row',
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const box = style([
	mediaBorder,
	{
		backgroundColor: colors.contrast_25,
		borderRadius: borderRadius.md,
		// RN Views are flex-by-default; restate it so the `flex: 1` contents fill the box height.
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
		overflow: 'hidden',
		position: 'relative',
		width: '100%',
	},
]);

export const contents = style({
	backgroundColor: '#000',
	backgroundImage: thumbVar,
	backgroundPosition: 'center',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'contain',
	cursor: 'default',
	display: 'flex',
	flex: 1,
});

// a 100vh-tall sentinel watched by an IntersectionObserver; must not live inside an overflow-hidden box.
export const observer = style({
	left: '50%',
	pointerEvents: 'none',
	position: 'absolute',
	width: 1,
});

export const observerInMessage = style({ height: '100%', top: 0 });
export const observerDefault = style({ height: '100vh', top: 'calc(50% - 50vh)' });
