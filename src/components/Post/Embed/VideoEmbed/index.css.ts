import { createVar, style } from '@vanilla-extract/css';

import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

/** `aspect-ratio` (width / height) driving the inner box's height. */
export const aspectVar = createVar();
/** `url(...)` of the video thumbnail, painted as the box background while loading. */
export const thumbVar = createVar();

export const root = style({ marginTop: space.sm });

export const viewport = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
});

// the hairline border lives on this outer box; the aspect ratio lives on `contents`. keeping them on
// separate boxes means the border-box inset never skews the video's ratio. the box has no fill of its
// own, so at the rounded corners the page background shows through — a contrasting skeleton fill here
// would instead leave a stray seam between the border and the clipped video.
export const box = style([
	mediaBorder,
	{
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		position: 'relative',
		width: '100%',
	},
]);

export const contents = style({
	aspectRatio: aspectVar,
	backgroundColor: '#000',
	backgroundImage: thumbVar,
	backgroundPosition: 'center',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'contain',
	cursor: 'default',
	display: 'flex',
	overflow: 'hidden',
	width: '100%',
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
