import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.sm,
	paddingTop: space.md,
});

export const languageWrap = style({
	width: '100%',
	height: 32,
	marginTop: space.md,
});

export const root = style({
	maxWidth: 245,
});

export const titleWrap = style({
	paddingTop: space.lg,
});
