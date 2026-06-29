import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize, zIndex } from '#/styles/tokens.css';

export const root = style(
	layered(components, {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
	}),
);

/**
 * The tab bar: a sticky, horizontally-scrollable row of tabs with a hairline bottom border. Width comes from
 * the shell's center column, so it needs no width wrapper.
 */
export const list = style(
	layered(components, {
		backgroundColor: vars.palette.contrast_0,
		borderBottom: `1px solid ${vars.palette.contrast_100}`,
		display: 'flex',
		flexDirection: 'row',
		overflowX: 'auto',
		position: 'sticky',
		top: 0,
		zIndex: zIndex.sticky,
		// dragging the row to scroll it shouldn't select the tab labels
		userSelect: 'none',
		// hide the horizontal scrollbar — tabs scroll into view programmatically
		scrollbarWidth: 'none',
		selectors: {
			'&::-webkit-scrollbar': { display: 'none' },
		},
	}),
);

// the underline lives on the label span, so it's sized to the text; this offset pins it back down to
// the tab's bottom edge across the vertical padding
const tabPaddingBlock = 12;

export const tab = style(
	layered(components, {
		alignItems: 'center',
		appearance: 'none',
		background: 'transparent',
		border: 'none',
		color: vars.palette.contrast_700,
		cursor: 'pointer',
		display: 'flex',
		flexGrow: 1,
		// keep tabs at their content width when the row overflows, so it scrolls instead of squashing
		flexShrink: 0,
		fontSize: fontSize.md,
		fontWeight: 600,
		justifyContent: 'center',
		margin: 0,
		paddingBlock: tabPaddingBlock,
		paddingInline: 16,
		whiteSpace: 'nowrap',
		selectors: {
			'&:hover': { backgroundColor: vars.palette.contrast_25 },
			'&[data-active]': { color: vars.palette.contrast_1000 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	}),
);

/**
 * The label text, carrying the active-tab underline so it tracks the text width (with a 4px overhang each
 * side).
 */
export const tabLabel = style({
	position: 'relative',
	'::after': {
		backgroundColor: 'transparent',
		bottom: -tabPaddingBlock,
		content: '""',
		height: 3,
		left: -4,
		position: 'absolute',
		right: -4,
	},
	selectors: {
		'[data-active] &::after': { backgroundColor: vars.palette.primary_500 },
	},
});

export const panel = style(
	layered(components, {
		flex: 1,
		selectors: {
			'&[hidden]': { display: 'none' },
		},
	}),
);
