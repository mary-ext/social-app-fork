import { style } from '@vanilla-extract/css';

// keeps the Popup's flex column intact; the wrapper only exists to catch Escape.
export const root = style({
	display: 'contents',
});
