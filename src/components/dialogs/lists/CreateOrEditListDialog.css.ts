import { style } from '@vanilla-extract/css';

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '20px',
	paddingBlock: '20px',
	paddingInline: '20px',
});

/** Left-aligns the avatar editor under its label. */
export const avatarWrap = style({
	alignItems: 'flex-start',
	display: 'flex',
});

export const errorWrap = style({
	marginTop: '20px',
	paddingInline: '20px',
});

export const errorText = style({
	marginTop: '4px',
});
