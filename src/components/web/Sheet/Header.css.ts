import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const outer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderBottom: `1px solid ${vars.palette.contrast_200}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: 8,
	minHeight: 50,
	paddingBlock: 6,
	paddingInline: 6,
});

// shrink-to-fit so it sits at its natural width when short; the equal-grow slots keep it centered, and
// `minWidth: 0` lets it shrink past its content (truncating the title) once the slots hit their button floors.
export const content = style({
	flex: '0 1 auto',
	minWidth: 0,
});

// both slots grow from a zero basis, so they stay equal width regardless of button content and the title
// lands in the header's true center. they're floored at their button's intrinsic width (no `minWidth: 0`),
// so a long title shrinks the title rather than clipping a button.
export const slot = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	selectors: {
		'&:first-child': { justifyContent: 'flex-start' },
		'&:last-child': { justifyContent: 'flex-end' },
	},
});
