import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize, space, zIndex } from '#/styles/tokens.css';

export const positioner = style(
	layered(components, {
		zIndex: zIndex.popover,
	}),
);

const MAX_POPUP_HEIGHT = 320;

const ANCHOR_FRACTION = 0.75;

export const popup = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		position: 'relative',
		flexDirection: 'column',
		transformOrigin: 'var(--transform-origin)',
		transitionDuration: '150ms',
		transitionProperty: 'opacity, transform',
		transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
		border: `1px solid ${vars.palette.contrast_100}`,
		borderRadius: 8,
		boxShadow: vars.shadow.md,
		backgroundColor: vars.palette.contrast_0,
		width: 'var(--anchor-width)',
		maxWidth: 'var(--available-width)',
		maxHeight: `min(${MAX_POPUP_HEIGHT}px, var(--available-height))`,
		overflow: 'hidden',
		'@media': {
			'(width >= 800px)': {
				width: `calc(var(--anchor-width) * ${ANCHOR_FRACTION})`,
			},
		},
		selectors: {
			'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
		},
	}),
);

export const search = style(
	layered(components, {
		flexShrink: 0,
		outline: 0,
		border: 'none',
		borderBottom: `1px solid ${vars.palette.contrast_100}`,
		borderRadius: 0,
		backgroundColor: 'transparent',
		padding: space.md,
		width: '100%',
		color: vars.palette.contrast_1000,
		fontFamily: 'inherit',
		fontSize: fontSize.md,
		'::placeholder': {
			color: vars.palette.contrast_500,
		},
	}),
);

export const list = style(
	layered(components, {
		flex: 1,
		padding: space.xs,
		minHeight: 0,
		overflowY: 'auto',
		overscrollBehavior: 'contain',
	}),
);

export const empty = style(
	layered(components, {
		padding: space.md,
		color: vars.palette.contrast_500,
		fontSize: fontSize.md_sub,
		selectors: {
			'&:empty': { display: 'none', padding: 0 },
		},
	}),
);

const ITEM_ICON_SIZE = 16;
const ITEM_INLINE_PADDING = 8;
const ITEM_BLOCK_PADDING = 6;

export const item = style(
	layered(components, {
		display: 'flex',
		position: 'relative',
		flexDirection: 'column',
		gap: 1,
		transitionDuration: '100ms',
		transitionProperty: 'background-color, color',
		outline: 0,
		borderRadius: 4,
		paddingRight: ITEM_INLINE_PADDING,
		paddingLeft: ITEM_ICON_SIZE + ITEM_INLINE_PADDING * 2,
		paddingBlock: ITEM_BLOCK_PADDING,
		color: vars.palette.contrast_1000,
		fontSize: fontSize.md_sub,
		cursor: 'pointer',
		userSelect: 'none',
		selectors: {
			'&[data-highlighted]': {
				backgroundColor: vars.palette.primary_50,
			},
		},
	}),
);

export const indicator = style(
	layered(components, {
		position: 'absolute',
		top: ITEM_BLOCK_PADDING + 2,
		left: ITEM_INLINE_PADDING,
		color: vars.palette.primary_600,
	}),
);
