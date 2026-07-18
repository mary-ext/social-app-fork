import { style } from '@vanilla-extract/css';

export const error = style({
	marginTop: 4,
});

export const field = style({
	position: 'relative',
});

export const fieldIcon = style({
	display: 'block',
	position: 'absolute',
	insetInlineStart: 12,
	top: '50%',
	transform: 'translateY(-50%)',
	pointerEvents: 'none',
});

export const fieldInput = style({
	paddingInlineStart: 40,
});
