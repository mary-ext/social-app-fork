import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	marginBottom: space._2xl,
	marginTop: space.lg,
});
export const actions = style({ display: 'flex', flexDirection: 'column', gap: space.md });
