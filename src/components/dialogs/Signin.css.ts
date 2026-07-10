import { style } from '@vanilla-extract/css';

export const error = style({
	marginTop: 4,
});

// positioning context for the leading @ icon overlaid on the input.
export const field = style({
	position: 'relative',
});

// leading @ icon, vertically centered and non-interactive so clicks fall through to the input.
export const fieldIcon = style({
	display: 'block',
	insetInlineStart: 12,
	pointerEvents: 'none',
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});

// leave room for the leading icon; unlayered so it overrides the TextField input's symmetric inline padding.
export const fieldInput = style({
	paddingInlineStart: 40,
});
