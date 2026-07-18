import { style } from '@vanilla-extract/css';

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 20,
	paddingBlock: 20,
	paddingInline: 20,
});

export const avatarWrap = style({
	display: 'flex',
	alignItems: 'flex-start',
});

export const errorWrap = style({
	marginTop: 20,
	paddingInline: 20,
});

export const errorText = style({
	marginTop: 4,
});
