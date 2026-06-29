import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const remove = style({
	insetBlockStart: '50%',
	insetInlineEnd: space.sm,
	position: 'absolute',
	transform: 'translateY(-50%)',
});
