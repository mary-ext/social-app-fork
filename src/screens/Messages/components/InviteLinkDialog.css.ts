import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const confirm = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	paddingTop: space.lg,
});

export const confirmTitle = style({
	marginTop: space.lg,
});

export const confirmMessage = style({
	marginTop: space.sm,
});

export const memberValue = style({
	display: 'block',
	marginBlock: space.sm,
});

export const radioList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});
