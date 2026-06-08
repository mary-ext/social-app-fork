import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const center = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space.md,
	justifyContent: 'center',
	minHeight: 0,
	paddingBlock: space._2xl,
	textAlign: 'center',
});
