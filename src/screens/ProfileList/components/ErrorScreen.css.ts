import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const outer = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBlock: space.md,
	paddingInline: space.xl,
});

export const actionRow = style({
	display: 'flex',
	flexDirection: 'row',
	marginTop: space.lg,
});
