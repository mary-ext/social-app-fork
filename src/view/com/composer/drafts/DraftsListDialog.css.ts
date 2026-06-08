import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// floored at 500 like the RNW InnerFlatList so the dialog keeps a stable height instead of shrinking to a
// short list; shrinks + scrolls within the popup's 80vh cap when the list outgrows it.
export const list = style({
	minHeight: 500,
	overflowY: 'auto',
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_50 },
		'.theme--dark &': { backgroundColor: vars.palette.contrast_0 },
		'.theme--dim &': { backgroundColor: '#000000' },
	},
});

export const listContent = style({
	paddingBottom: space.xl,
});

// item gutters tighten on narrow viewports, matching the old `gtPhone` breakpoint.
export const itemWrap = style({
	paddingInline: space.sm,
	paddingTop: space.sm,
	'@media': {
		'(min-width: 500px)': {
			paddingInline: space.md,
			paddingTop: space.md,
		},
	},
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: space.xl,
});

// matches the list floor so the empty content centers in the dialog rather than hugging the top.
export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	justifyContent: 'center',
	minHeight: 500,
	paddingInline: space.xl,
});

export const emptyIcon = style({
	color: vars.palette.contrast_400,
	display: 'flex',
});

export const footerNote = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: space._2xl,
});
