import { style } from '@vanilla-extract/css';

import { borderRadius, space } from '#/styles/tokens.css';

export const root = style({ position: 'relative' });

export const popup = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	bottom: '100%',
	flexDirection: 'column',
	width: '100%',
	height: 100,
	minHeight: 0,
});

export const popupInner = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	alignItems: 'center',
	marginBottom: space.xs,
	borderRadius: borderRadius.xs,
	backgroundColor: 'rgba(0, 0, 0, 0.6)',
	paddingBlock: space.xs,
	paddingInline: space._2xs,
	minHeight: 0,
});

export const slider = style({ height: '100%' });

export const sliderSafari = style({ height: 92, minHeight: '100%' });
