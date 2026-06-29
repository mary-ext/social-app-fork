import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const row = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	maxWidth: '100%',
});

/** Lock out interaction when the handle is a non-interactive preview (e.g. inside the hover card). */
export const noTaps = style({
	pointerEvents: 'none',
});

// flex so the inline Text span doesn't inherit the wrapper's font strut and inflate the line box.
// `flex-shrink: 0` keeps the label on one line (the handle beside it shrinks instead).
export const followsYou = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 4,
	display: 'flex',
	flexShrink: 0,
	paddingBlock: 4,
	paddingInline: 8,
});

// isolate the handle's bidi so an RTL display name above it can't flip the `@handle`, and break long
// handles mid-string rather than letting them overflow the row.
export const handle = style({
	direction: 'ltr',
	unicodeBidi: 'isolate',
	wordBreak: 'break-all',
});
