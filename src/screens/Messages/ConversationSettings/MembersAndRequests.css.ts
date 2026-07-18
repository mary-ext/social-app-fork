import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const labelGroup = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
});

export const row = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'space-between',
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.lg,
});
