import { style } from '@vanilla-extract/css';

export const error = style({
	marginTop: 4,
});

export const field = style({
	position: 'relative',
});

export const fieldIcon = style({
	display: 'block',
	insetInlineStart: 12,
	pointerEvents: 'none',
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
});

export const fieldInput = style({
	paddingInlineStart: 40,
});
