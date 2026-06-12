import { style } from '@vanilla-extract/css';

/**
 * Spacing below the post text before the embed/controls. `display: flex` so the wrapper hugs the text instead
 * of inflating its line box with the inherited font strut.
 */
export const richText = style({
	display: 'flex',
	flexDirection: 'column',
	marginBottom: 2,
});
