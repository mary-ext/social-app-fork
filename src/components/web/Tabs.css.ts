import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize } from '#/styles/tokens.css';

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
		zIndex: 10,
		// dragging the row to scroll it shouldn't select the tab labels
		userSelect: 'none',
		// hide the horizontal scrollbar — tabs scroll into view programmatically
		scrollbarWidth: 'none',
		selectors: {
			'&::-webkit-scrollbar': { display: 'none' },
		},
	}),
);

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
		paddingBlock: 12,
		paddingInline: 16,
		position: 'relative',
		whiteSpace: 'nowrap',
		// the active underline, matching the previous per-item indicator (centered, min 45px wide)
		'::after': {
			backgroundColor: 'transparent',
			bottom: 0,
			content: '""',
			height: 3,
			left: '50%',
			minWidth: 45,
			position: 'absolute',
			transform: 'translateX(-50%)',
			width: 'calc(100% - 28px)',
		},
		selectors: {
			'&:hover': { backgroundColor: vars.palette.contrast_25 },
			'&[data-active]': { color: vars.palette.contrast_1000 },
			'&[data-active]::after': { backgroundColor: vars.palette.primary_500 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	}),
);

export const panel = style(
	layered(components, {
		flex: 1,
		selectors: {
			'&[hidden]': { display: 'none' },
		},
	}),
);
