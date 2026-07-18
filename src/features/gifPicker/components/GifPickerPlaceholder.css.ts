import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const center = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space._2xl,
	minHeight: 0,
	textAlign: 'center',
});
