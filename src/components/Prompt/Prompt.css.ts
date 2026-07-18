import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { zIndex } from '#/styles/tokens.css';

export const portal = style(
	layered(components, {
		zIndex: zIndex.modal,
	}),
);

export const backdrop = style(
	layered(components, {
		position: 'fixed',
		inset: 0,
		transitionDuration: '150ms',
		transitionProperty: 'opacity',
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		selectors: {
			'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
		},
	}),
);

export const viewport = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		position: 'fixed',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		overflowY: 'auto',
	}),
);

export const popup = recipe(
	{
		base: {
			boxSizing: 'border-box',
			position: 'relative',
			transitionDuration: '200ms',
			transitionProperty: 'opacity, transform',
			transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
			border: `1px solid ${vars.palette.contrast_200}`,
			borderRadius: 20,
			boxShadow: vars.shadow.lg,
			backgroundColor: vars.palette.contrast_0,
			padding: 24,
			width: '100%',
			selectors: {
				'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
			},
		},
		variants: {
			size: {
				default: { maxWidth: 320 },
				wide: { maxWidth: 420 },
			},
		},
		defaultVariants: { size: 'default' },
	},
	{ debugId: 'promptPopup', layer: components },
);

export const title = style({
	display: 'block',
	paddingBottom: 4,
});

export const description = style({
	display: 'block',
	paddingBottom: 16,
});

export const content = style({
	paddingBottom: 8,
});

export const rows = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 14,
	paddingBottom: 16,
});

export const row = style({
	display: 'flex',
	gap: 12,
	alignItems: 'flex-start',
});

export const rowIcon = style({
	flexShrink: 0,
});

export const rowText = style({
	paddingBlock: 1,
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
	width: '100%',
});
