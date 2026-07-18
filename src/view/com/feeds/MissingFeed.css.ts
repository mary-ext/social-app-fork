import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const profileRow = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	width: '100%',
});

export const italic = style({
	fontStyle: 'italic',
});

export const labelSpaced = style({
	marginTop: space.md,
});

export const notice = style({
	display: 'block',
	width: '100%',
	fontStyle: 'italic',
});
