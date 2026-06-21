import { style } from '@vanilla-extract/css';

// the round-tiny button is a 25px box (a comfortable tap target) around a 16px icon; negative margins collapse
// its layout footprint to that 16px so the glyph sits flush like a LinkRow's trailing chevron, while the box
// overflows into the surrounding padding as tap area
export const optionsButton = style({
	margin: -4.5,
});
