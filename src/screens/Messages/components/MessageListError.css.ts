import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	width: '100%',
	marginBlock: space.md,
});

export const inner = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space.sm,
	maxWidth: 400,
});
