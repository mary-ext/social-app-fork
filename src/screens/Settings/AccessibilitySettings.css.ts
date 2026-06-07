import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const groupBody = style({
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
// inset the rows to align under the title text, past the header icon (24px) + gap (8px)
export const insetColumn = style({
	display: 'flex',
	flexDirection: 'column',
	gap: `${space.sm}px`,
	paddingLeft: `${space._4xl}px`,
});
