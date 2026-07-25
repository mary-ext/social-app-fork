import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	minHeight: '100dvh',
	paddingTop: 'env(safe-area-inset-top, 0px)',
	paddingBottom: 'env(safe-area-inset-bottom, 0px)',
	gap: space.md,
});
