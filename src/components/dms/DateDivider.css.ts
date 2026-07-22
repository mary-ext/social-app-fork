import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const root = style({
	marginTop: space.md,
	paddingInline: space.md,
	textAlign: 'center',
});
