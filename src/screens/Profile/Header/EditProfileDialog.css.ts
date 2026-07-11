import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const errorText = style({ marginTop: space.xs });

export const inactiveSave = style({ color: vars.palette.contrast_400 });

export const bannerWrap = style({
	position: 'relative',
});

export const avatar = style({
	borderColor: vars.palette.contrast_0,
	borderRadius: 42,
	borderStyle: 'solid',
	borderWidth: 2,
	boxSizing: 'border-box',
	height: 84,
	left: 20,
	position: 'absolute',
	top: 80,
	width: 84,
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
