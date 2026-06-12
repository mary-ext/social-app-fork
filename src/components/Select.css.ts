import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize } from '#/styles/tokens.css';

export const trigger = style(
	layered(components, {
		alignItems: 'center',
		backgroundColor: vars.palette.contrast_50,
		border: `1px solid ${vars.palette.contrast_50}`,
		borderRadius: 10,
		boxSizing: 'border-box',
		color: vars.palette.contrast_1000,
		cursor: 'pointer',
		display: 'flex',
		fontSize: fontSize.sm,
		gap: 8,
		justifyContent: 'space-between',
		maxWidth: 400,
		outline: 0,
		paddingBlock: 8,
		paddingInline: 12,
		width: '100%',
		selectors: {
			'&:focus-visible': { borderColor: vars.palette.primary_500 },
			'&[data-popup-open]': { borderColor: vars.palette.primary_500 },
		},
	}),
);

export const value = style(
	layered(components, {
		overflow: 'hidden',
		textAlign: 'left',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	}),
);

export const icon = style(
	layered(components, {
		alignItems: 'center',
		color: vars.palette.contrast_1000,
		display: 'flex',
		flexShrink: 0,
		// taller than the 12px chevron so the icon (not the text) sets the trigger's content row to 20px,
		// giving a 38px trigger height. the chevron stays centered at its natural size.
		height: 20,
	}),
);

export const positioner = style(
	layered(components, {
		zIndex: 10,
	}),
);

export const popup = style(
	layered(components, {
		backgroundColor: vars.palette.contrast_0,
		border: `1px solid ${vars.palette.contrast_100}`,
		borderRadius: 8,
		boxShadow: vars.shadow.md,
		boxSizing: 'border-box',
		// the list scrolls inside; the popup clips it (rounded corners) and anchors the scroll arrows
		display: 'flex',
		flexDirection: 'column',
		maxHeight: 'var(--available-height)',
		// stretch the dropdown to the trigger's width (Base UI anchor) instead of shrinking to its
		// content, while still growing past it for longer item labels
		minWidth: 'var(--anchor-width)',
		overflow: 'hidden',
		position: 'relative',
		transformOrigin: 'var(--transform-origin)',
		transitionDuration: '150ms',
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
		selectors: {
			'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
		},
	}),
);

export const list = style(
	layered(components, {
		flex: 1,
		// the scroll container the scroll arrows drive; `minHeight: 0` lets it shrink to scroll inside the flex popup
		minHeight: 0,
		overflowY: 'auto',
		padding: 4,
	}),
);

// the up/down hover-to-scroll affordances, fading the clipped list edge into the popup background.
// shown only when the list overflows (Base UI mounts them on demand). Base UI sets `position: absolute`.
const scrollArrow = style(
	layered(components, {
		alignItems: 'center',
		color: vars.palette.contrast_1000,
		display: 'flex',
		height: 24,
		justifyContent: 'center',
		left: 0,
		right: 0,
		zIndex: 1,
	}),
);

export const scrollUpArrow = style([
	scrollArrow,
	layered(components, {
		background: `linear-gradient(to bottom, ${vars.palette.contrast_0}, transparent)`,
		top: 0,
	}),
]);

export const scrollDownArrow = style([
	scrollArrow,
	layered(components, {
		background: `linear-gradient(to top, ${vars.palette.contrast_0}, transparent)`,
		bottom: 0,
	}),
]);

export const item = style(
	layered(components, {
		alignItems: 'center',
		borderRadius: 4,
		color: vars.palette.contrast_1000,
		cursor: 'pointer',
		display: 'flex',
		fontSize: fontSize.sm,
		minHeight: 25,
		outline: 0,
		paddingBlock: 2,
		paddingLeft: 30,
		paddingRight: 8,
		position: 'relative',
		transitionDuration: '100ms',
		transitionProperty: 'background-color, color',
		userSelect: 'none',
		selectors: {
			'&[data-highlighted]': { backgroundColor: vars.palette.primary_50 },
			'&[data-selected]': { fontWeight: 600 },
		},
	}),
);

export const indicator = style(
	layered(components, {
		alignItems: 'center',
		color: vars.palette.primary_500,
		display: 'flex',
		justifyContent: 'center',
		left: 0,
		position: 'absolute',
		width: 30,
	}),
);
