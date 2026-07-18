import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const labelGroup = style({
	display: 'flex',
	gap: space.xs,
	alignItems: 'center',
});

export const row = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingTop: space.lg,
	paddingBottom: space.sm,
	paddingInline: space.lg,
});
