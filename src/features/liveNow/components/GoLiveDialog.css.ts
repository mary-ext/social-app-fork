import { style } from '@vanilla-extract/css';

// gap before the muted time hint, in both the trigger value and the dropdown options. the literal spaces in
// the markup collapse under the web Text's `white-space: normal`, so restate the gap as a margin here.
export const timeGap = style({
	marginLeft: 4,
});
