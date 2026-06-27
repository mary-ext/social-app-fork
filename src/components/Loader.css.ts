import { createVar, style } from '@vanilla-extract/css';

export const fill = style({
	inset: 0,
	position: 'absolute',
});

/** Edge length of the loader box in px, wired inline so it tracks the icon size. */
export const sizeVar = createVar();

export const container = style({
	alignItems: 'center',
	display: 'flex',
	height: sizeVar,
	justifyContent: 'center',
	position: 'relative',
	width: sizeVar,
});
