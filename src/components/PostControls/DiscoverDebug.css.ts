import { style } from '@vanilla-extract/css';

/** The clickable debug overlay: a tiny feed-context label pinned to the row's lower-left corner. */
export const label = style({
	bottom: -4,
	cursor: 'pointer',
	left: 0,
	maxWidth: 65,
	position: 'absolute',
	zIndex: 1000,
});

/** Shrinks the label well below the text scale; pairs with single-line clamping. */
export const text = style({
	fontSize: 7,
	lineHeight: 'normal',
});
