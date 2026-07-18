import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
});

export const loaderWrap = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: space.xl,
});
