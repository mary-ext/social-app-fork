import { style } from '@vanilla-extract/css';

import { REMOVE_BUTTON_SIZE, removeButtonEnd, rowBlockPadding } from './shared.css';

// matches the row's first line height.
const LINE_HEIGHT = 20;

export const remove = style({
	position: 'absolute',
	top: `calc(${rowBlockPadding} + ${(LINE_HEIGHT - REMOVE_BUTTON_SIZE) / 2}px)`,
	right: removeButtonEnd,
});
