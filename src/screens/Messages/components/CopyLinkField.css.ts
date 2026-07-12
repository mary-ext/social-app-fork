import { style } from '@vanilla-extract/css';

// positioning context for the trailing copy button; its height tracks the input (the only in-flow child)
// so `top: 50%` centers the button on the field.
export const root = style({
	position: 'relative',
});

// leave trailing room for the copy button. kept unlayered so it overrides the TextField input's symmetric
// inline padding (which wins the component layer).
export const input = style({
	paddingInlineEnd: 44,
});

export const button = style({
	insetInlineEnd: 6,
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});
