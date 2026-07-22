import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	alignItems: 'center',
	paddingBlock: space.md,
	paddingInline: space.lg,
});
