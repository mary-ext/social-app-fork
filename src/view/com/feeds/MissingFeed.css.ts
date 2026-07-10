import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const profileRow = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
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
	fontStyle: 'italic',
	width: '100%',
});
