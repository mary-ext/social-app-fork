import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const badge = style({
	display: 'flex',
	position: 'absolute',
	top: 8,
	left: 8,
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
	zIndex: 10,
	border: 'none',
	borderRadius: 6,
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	paddingTop: space._2xs,
	paddingRight: space.sm,
	paddingBottom: space._2xs,
	paddingLeft: space.xs,
	color: vars.palette.white,
	cursor: 'pointer',
});

export const admonition = style({
	marginTop: space.sm,
});
