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
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		position: 'relative',
		width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${aspectVar}))`,
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

export const observer = style({
	left: '50%',
	pointerEvents: 'none',
	position: 'absolute',
	width: 1,
});

export const observerInMessage = style({ height: '100%', top: 0 });
export const observerDefault = style({ height: '100vh', top: 'calc(50% - 50vh)' });
