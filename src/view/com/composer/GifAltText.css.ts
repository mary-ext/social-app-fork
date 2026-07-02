import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const badge = style({
	position: 'absolute',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.xs,
	paddingLeft: space.xs,
	paddingRight: space.sm,
	paddingTop: space._2xs,
	paddingBottom: space._2xs,
	top: 8,
	left: 8,
	borderRadius: 6,
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	border: 'none',
	color: vars.palette.white,
	cursor: 'pointer',
	zIndex: 10,
});

export const admonition = style({
	marginTop: space.sm,
});
