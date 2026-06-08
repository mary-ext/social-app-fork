import { style } from '@vanilla-extract/css';

// matches the composer popup's resting height so the dialog doesn't resize when the lazy chunk resolves
// (331px = composer content height minus the popup's 1px borders).
export const placeholder = style({
	alignItems: 'center',
	display: 'flex',
	height: 331,
	justifyContent: 'center',
});
