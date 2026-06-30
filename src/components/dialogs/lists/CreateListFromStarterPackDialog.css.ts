import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
});

// reversed so the primary "create" action sits on the right while leading the DOM order.
export const actions = style({
	display: 'flex',
	flexDirection: 'row-reverse',
	gap: space.md,
	paddingTop: space.sm,
});
