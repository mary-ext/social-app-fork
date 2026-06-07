import { style } from '@vanilla-extract/css';

// positions the editor box within the composer row (the avatar sits to its left); the composer owns its own
// internal layout.
export const editor = style({
	alignSelf: 'flex-start',
	flex: 1,
	marginBottom: 10,
	marginLeft: 8,
});
