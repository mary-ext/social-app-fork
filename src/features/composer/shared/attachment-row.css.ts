import { globalStyle, style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

import { RIGHT_PADDING } from './layout';

/** a post's media or link embed row, below its text. */
export const attachmentRow = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingTop: space.md,
	paddingRight: RIGHT_PADDING,
});

// keep the row's padding transparent to caret drags.
globalStyle(`${attachmentRow} > *`, {
	pointerEvents: 'auto',
});
