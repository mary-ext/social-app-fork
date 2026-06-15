import { style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({ position: 'relative' });

export const popup = style({
	bottom: '100%',
	display: 'flex',
	flexDirection: 'column',
	height: 100,
	position: 'absolute',
	width: '100%',
});

export const popupInner = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	borderRadius: borderRadius.xs,
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	marginBottom: space.xs,
	paddingBlock: space.xs,
	paddingInline: space._2xs,
});

export const slider = style({ height: '100%' });

// ridiculous safari hack for an old version of safari; fixed in the sonoma beta.
export const sliderSafari = style({ height: 92, minHeight: '100%' });
