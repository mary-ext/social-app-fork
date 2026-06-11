import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// the Toggle group dissolves into the bounded popup's flex column so the header/list/footer become its direct
// children (pinned header + footer, scrolling list).
export const group = style({
	display: 'contents',
});

// pinned header above the scrolling list: title block + search field. the 16px column gap sets the
// subtitle-to-search spacing; the tight bottom padding keeps it close to the list.
export const header = style({
	backgroundColor: vars.palette.contrast_0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
	flexShrink: 0,
	paddingBottom: 4,
	paddingInline: 24,
	paddingTop: 24,
});

export const headerRow = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	gap: 8,
});

export const titleBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

// the scroll region carries the 24px horizontal inset so rows (and their dividers) stop short of the edges.
// the matching bottom padding gives the last rows a little breathing room above the pinned footer.
export const list = style({
	paddingBottom: 24,
	paddingInline: 24,
});

// a section label (e.g. "Recently used"); a block span so its padding lays out as a row.
export const sectionHeader = style({
	display: 'block',
	paddingBottom: 12,
	paddingTop: 28,
});

// a language row inside the list: full-width clickable toggle with the name (flex-grown) and a trailing
// checkbox. horizontal padding lives on the list, so the row's divider insets with it.
export const row = style({
	boxSizing: 'border-box',
	paddingBlock: 12,
});

export const rowBorder = style({
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
});

export const rowLabel = style({
	flex: 1,
	selectors: {
		// dimmed (by color, not opacity) once the selection cap disables this unchecked row.
		'[data-disabled] &': { color: vars.palette.contrast_400 },
	},
});

// the Done button stretches the full footer width.
export const doneButton = style({
	width: '100%',
});

// the error-boundary fallback, rendered in place of the list machinery.
export const error = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	padding: 20,
});
