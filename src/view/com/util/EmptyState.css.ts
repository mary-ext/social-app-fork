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
	alignItems: 'center',
	alignSelf: 'center',
	borderRadius: 999,
	display: 'flex',
	flexDirection: 'row',
	height: 64,
	justifyContent: 'center',
	width: 64,
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
	alignSelf: 'center',
	display: 'flex',
	flexShrink: 1,
	marginTop: 24,
});
