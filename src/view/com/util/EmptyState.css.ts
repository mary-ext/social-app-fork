import { style } from '@vanilla-extract/css';

export const root = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: 50,
	paddingInline: 24,
	width: '100%',
});

export const iconBox = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	alignSelf: 'center',
	justifyContent: 'center',
	borderRadius: 999,
	width: 64,
	height: 64,
});

export const message = style({
	alignSelf: 'center',
	marginTop: 4,

	'@media': {
		'(min-width: 800px)': {
			maxWidth: '60%',
		},
	},
});

export const buttonWrap = style({
	display: 'flex',
	flexShrink: 1,
	alignSelf: 'center',
	marginTop: 24,
});
