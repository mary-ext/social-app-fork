import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// shared unread affordances for the nav surfaces (left rail, bottom bar, drawer). each surface composes these
// bases with its own absolute offsets, so the pill and dot look identical wherever they appear.

// the unread-count pill: a circle for a single digit that stretches into a pill for wider counts. flex-centering
// the digit keeps it on the badge's axis without a hand-tuned line-height. pair with a `sm`/`semiBold`/`white`
// Text node for the count.
export const badge = style({
	alignItems: 'center',
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	boxSizing: 'border-box',
	display: 'flex',
	fontVariantNumeric: 'tabular-nums',
	justifyContent: 'center',
	minWidth: 20,
	paddingBlock: 2,
	paddingInline: 5,
	position: 'absolute',
});

// the "has new" dot, shown in place of a count.
export const hasNewDot = style({
	backgroundColor: vars.palette.primary_500,
	borderRadius: 999,
	height: 8,
	position: 'absolute',
	width: 8,
});
