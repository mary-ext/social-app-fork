import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: `${space.sm}px`,
	width: '100%',
});
export const headerRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: `${space.sm}px`,
});
export const insetColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: `${space.md}px`,
	paddingLeft: `${space._4xl}px`,
});
export const inset = style({ paddingLeft: `${space._4xl}px` });
