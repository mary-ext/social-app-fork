import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: `${space.lg}px`,
	marginBottom: `${space._2xl}px`,
	marginTop: `${space.lg}px`,
});
export const actions = style({ display: 'flex', flexDirection: 'column', gap: `${space.md}px` });
