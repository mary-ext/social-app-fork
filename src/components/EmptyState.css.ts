import { style } from '@vanilla-extract/css';

export const buttonWrap = style({
	display: 'flex',
	alignSelf: 'center',
	flexShrink: 1,
	marginTop: 24,
});

export const iconBox = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	alignSelf: 'center',
	justifyContent: 'center',
	width: 64,
	height: 64,
	borderRadius: 999,
});

export const message = style({
	alignSelf: 'center',
	marginTop: 4,
});

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	boxSizing: 'border-box',
	paddingBlock: 50,
	paddingInline: 24,
});
