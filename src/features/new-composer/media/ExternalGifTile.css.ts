import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { borderRadius } from '#/styles/tokens.css';

export const ratioVar = createVar();

// preserve the aspect ratio within the feed's height limit.
export const tile = style({
	borderRadius: borderRadius.md,
	aspectRatio: ratioVar,
	width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
});

export const media = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'cover',
	pointerEvents: 'none',
});

export const playback = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 'inherit',
	cursor: 'pointer',
});
