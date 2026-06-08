import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// fixed, padded header — rendered before the close button so the search input is the first tabbable (and
// thus what Base UI focuses on open). matches the dialog's responsive horizontal/top padding.
export const header = style({
	backgroundColor: vars.palette.contrast_0,
	flexShrink: 0,
	paddingInline: space.xl,
	paddingTop: space.xl,
	'@media': {
		'(min-width: 800px)': {
			paddingInline: space._2xl,
			paddingTop: space._2xl,
		},
	},
});

// the empty/loading/error region below the header; fills the remaining popup height with responsive
// horizontal padding so its centered content lines up with the grid.
export const placeholder = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minHeight: 0,
	paddingInline: space.xl,
	'@media': {
		'(min-width: 800px)': {
			paddingInline: space._2xl,
		},
	},
});
