import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius } from '#/styles/tokens.css';

export const ratioVar = createVar();

export const container = style([
	mediaBorder,
	{
		aspectRatio: ratioVar,
		backgroundColor: '#000',
		borderRadius: borderRadius.md,
		marginTop: 4,
		overflow: 'hidden',
		position: 'relative',
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${ratioVar}))`,
	},
]);

export const media = style({
	display: 'block',
	height: '100%',
	objectFit: 'contain',
	width: '100%',
});

export const playButtonOverlay = style({
	alignItems: 'center',
	display: 'flex',
	inset: 0,
	justifyContent: 'center',
	pointerEvents: 'none',
	position: 'absolute',
});

export const previewUnavailable = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	height: '100%',
	justifyContent: 'center',
	paddingLeft: 16,
	paddingRight: 16,
	width: '100%',
});

export const previewUnavailableText = style({
	color: '#fff',
});
