import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const errorText = style({ marginTop: space.xs });

export const inactiveSave = style({ color: vars.palette.contrast_400 });

export const bannerWrap = style({
	position: 'relative',
});

export const avatar = style({
	boxSizing: 'border-box',
	position: 'absolute',
	top: 80,
	left: 20,
	borderWidth: 2,
	borderStyle: 'solid',
	borderRadius: 42,
	borderColor: vars.palette.contrast_0,
	width: 84,
	height: 84,
});

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 20,
	marginTop: 32,
	paddingBottom: 24,
	paddingInline: 20,
});

export const errorWrap = style({
	marginTop: 20,
	paddingInline: 20,
});
