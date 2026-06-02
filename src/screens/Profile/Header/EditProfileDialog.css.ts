import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const bannerWrap = style({
	position: 'relative',
});

/** Avatar overlapping the banner; wraps the web-native EditableAvatar. */
export const avatar = style({
	borderColor: vars.palette.contrast_0,
	borderRadius: '42px',
	borderStyle: 'solid',
	borderWidth: '2px',
	boxSizing: 'border-box',
	height: '84px',
	left: '20px',
	position: 'absolute',
	top: '80px',
	width: '84px',
});

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: '20px',
	marginTop: '32px',
	paddingBottom: '24px',
	paddingInline: '20px',
});

export const errorWrap = style({
	marginTop: '20px',
	paddingInline: '20px',
});
