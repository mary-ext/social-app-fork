import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { fontSize, space, zIndex } from '#/styles/tokens.css';

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
		height: 20,
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
			backgroundColor: vars.palette.contrast_0,
			border: `1px solid ${vars.palette.contrast_100}`,
			borderRadius: 8,
			boxShadow: vars.shadow.md,
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			maxHeight: 'var(--available-height)',
			maxWidth: 'var(--available-width)',
			overflow: 'hidden',
			position: 'relative',
			transformOrigin: 'var(--transform-origin)',
			transitionDuration: '150ms',
			transitionProperty: 'opacity, transform',
			transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
			selectors: {
				'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
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
		minHeight: 0,
		overflowY: 'auto',
		padding: space.xs,
		scrollPaddingBlock: SCROLL_ARROW_HEIGHT + space.xs,
		scrollPaddingInline: space.xs,
	}),
);

const scrollArrow = style(
	layered(components, {
		alignItems: 'center',
		color: vars.palette.contrast_1000,
		display: 'flex',
		height: SCROLL_ARROW_HEIGHT,
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

const ITEM_LINE_HEIGHT = 20;
const ITEM_ICON_SIZE = 16;
const ITEM_BLOCK_PADDING = 5;
const ITEM_INLINE_PADDING = 8;

export const item = style(
	layered(components, {
		borderRadius: 4,
		color: vars.palette.contrast_1000,
		cursor: 'pointer',
		display: 'flex',
		fontSize: fontSize.md_sub,
		lineHeight: `${ITEM_LINE_HEIGHT}px`,
		outline: 0,
		paddingBlock: ITEM_BLOCK_PADDING,
		paddingLeft: ITEM_ICON_SIZE + ITEM_INLINE_PADDING * 2,
		paddingRight: ITEM_INLINE_PADDING,
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
		color: vars.palette.primary_600,
		left: 8,
		position: 'absolute',
		top: ITEM_BLOCK_PADDING + (ITEM_LINE_HEIGHT - ITEM_ICON_SIZE) / 2,
	}),
);
