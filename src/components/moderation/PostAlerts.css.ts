import { style } from '@vanilla-extract/css';

// `sm` pills carry no resting background, so pull the row left by the pill's 3px padding to align the first
// label's glyph flush with the content column.
export const smOffset = style({
	marginLeft: -3,
});
