import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const headerRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

// align the toggle under the title text, past the header icon (24) + gap (8)
export const insetColumn = style({
	paddingLeft: space._4xl,
});
