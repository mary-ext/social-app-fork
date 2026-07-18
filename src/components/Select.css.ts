import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize, space, zIndex } from '#/styles/tokens.css';

export const trigger = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		gap: 8,
		alignItems: 'center',
		justifyContent: 'space-between',
		outline: 0,
		border: `1px solid ${vars.palette.contrast_50}`,
		borderRadius: 10,
		backgroundColor: vars.palette.contrast_50,
		paddingBlock: 8,
		paddingInline: 12,
		width: '100%',
		maxWidth: 400,
		color: vars.palette.contrast_1000,
		fontSize: fontSize.sm,
		cursor: 'pointer',
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
		display: 'flex',
		flexShrink: 0,
		alignItems: 'center',
		height: 20,
		color: vars.palette.contrast_1000,
	}),
);

export const positioner = style(
	layered(components, {
		zIndex: zIndex.popover,
	}),
);

export const popup = recipe(
	{
		base: {
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
			maxWidth: 'var(--available-width)',
			maxHeight: 'var(--available-height)',
			overflow: 'hidden',
			selectors: {
				'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
			},
		},
		defaultVariants: {
			matchTriggerWidth: true,
		},
		variants: {
			matchTriggerWidth: {
				true: {
					minWidth: 'var(--anchor-width)',
				},
				false: {
					minWidth: 'fit-content',
				},
			},
		},
	},
	{ debugId: 'popup', layer: components },
);

const SCROLL_ARROW_HEIGHT = 24;

export const list = style(
	layered(components, {
		flex: 1,
		padding: space.xs,
		minHeight: 0,
		overflowY: 'auto',
		scrollPaddingBlock: SCROLL_ARROW_HEIGHT + space.xs,
		scrollPaddingInline: space.xs,
	}),
);

const scrollArrow = style(
	layered(components, {
		display: 'flex',
		right: 0,
		left: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
		height: SCROLL_ARROW_HEIGHT,
		color: vars.palette.contrast_1000,
	}),
);

export const scrollUpArrow = style([
	scrollArrow,
	layered(components, {
		top: 0,
		background: `linear-gradient(to bottom, ${vars.palette.contrast_0}, transparent)`,
	}),
]);

export const scrollDownArrow = style([
	scrollArrow,
	layered(components, {
		bottom: 0,
		background: `linear-gradient(to top, ${vars.palette.contrast_0}, transparent)`,
	}),
]);

const ITEM_LINE_HEIGHT = 20;
const ITEM_ICON_SIZE = 16;
const ITEM_BLOCK_PADDING = 5;
const ITEM_INLINE_PADDING = 8;

export const item = style(
	layered(components, {
		display: 'flex',
		position: 'relative',
		transitionDuration: '100ms',
		transitionProperty: 'background-color, color',
		outline: 0,
		borderRadius: 4,
		paddingRight: ITEM_INLINE_PADDING,
		paddingLeft: ITEM_ICON_SIZE + ITEM_INLINE_PADDING * 2,
		paddingBlock: ITEM_BLOCK_PADDING,
		lineHeight: `${ITEM_LINE_HEIGHT}px`,
		color: vars.palette.contrast_1000,
		fontSize: fontSize.md_sub,
		cursor: 'pointer',
		userSelect: 'none',
		selectors: {
			'&[data-highlighted]': { backgroundColor: vars.palette.primary_50 },
			'&[data-selected]': { fontWeight: 600 },
		},
	}),
);

export const indicator = style(
	layered(components, {
		position: 'absolute',
		top: ITEM_BLOCK_PADDING + (ITEM_LINE_HEIGHT - ITEM_ICON_SIZE) / 2,
		left: 8,
		color: vars.palette.primary_600,
	}),
);
