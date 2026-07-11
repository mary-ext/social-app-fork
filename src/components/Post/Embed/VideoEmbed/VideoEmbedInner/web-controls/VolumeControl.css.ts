import { style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({ position: 'relative' });

export const popup = style({
	boxSizing: 'border-box',
	bottom: '100%',
	display: 'flex',
	flexDirection: 'column',
	height: 100,
	minHeight: 0,
	position: 'absolute',
	width: '100%',
});

export const popupInner = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	borderRadius: borderRadius.xs,
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	marginBottom: space.xs,
	minHeight: 0,
	paddingBlock: space.xs,
	paddingInline: space._2xs,
});

export const slider = style({ height: '100%' });

export const sliderSafari = style({ height: 92, minHeight: '100%' });
