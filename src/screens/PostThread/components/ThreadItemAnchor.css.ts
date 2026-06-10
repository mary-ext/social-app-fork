import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const contentHiderChild = style({
	paddingTop: 8,
});

// the author column sits between the avatar and the follow button. min-width:0 lets it shrink so the
// clamped name/handle ellipsize instead of shoving the follow button off the row.
export const header = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
});

// the badges keep their intrinsic size; only the name beside them shrinks.
export const badges = style({
	flexShrink: 0,
	paddingLeft: space.xs,
});

// isolate the handle's bidi so an RTL display name above it can't flip the `@handle`.
export const handle = style({
	direction: 'ltr',
	unicodeBidi: 'isolate',
});
