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
		maxHeight: 'var(--available-height)',
		// stretch the dropdown to the trigger's width (Base UI anchor) instead of shrinking to its
		// content, while still growing past it for longer item labels
		minWidth: 'var(--anchor-width)',
		overflowY: 'auto',
	}),
);

export const list = style(
	layered(components, {
		padding: 4,
	}),
);

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
