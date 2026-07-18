import { createVar, style } from '@vanilla-extract/css';

import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const aspectVar = createVar();
export const thumbVar = createVar();

export const root = style({ marginTop: space.sm });

export const viewport = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
});

export const box = style([
	mediaBorder,
	{
		position: 'relative',
		borderRadius: borderRadius.md,
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${aspectVar}))`,
		overflow: 'hidden',
	},
]);

export const contents = style({
	display: 'flex',
	backgroundColor: '#000',
	backgroundImage: thumbVar,
	backgroundPosition: 'center',
	backgroundRepeat: 'no-repeat',
	backgroundSize: 'contain',
	aspectRatio: aspectVar,
	width: '100%',
	overflow: 'hidden',
	cursor: 'default',
});

export const observer = style({
	position: 'absolute',
	left: '50%',
	width: 1,
	pointerEvents: 'none',
});

export const observerInMessage = style({ top: 0, height: '100%' });
export const observerDefault = style({ top: 'calc(50% - 50vh)', height: '100vh' });
