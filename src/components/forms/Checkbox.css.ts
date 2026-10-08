import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { layered } from '#/styles/layers';
import { components } from '#/styles/layers.css';
import { borderRadius } from '#/styles/tokens.css';

export const root = style(
	layered(components, {
		display: 'inline-flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: borderRadius.sm,
		minHeight: 36,
		cursor: 'pointer',
		selectors: {
			'&:has(> input:focus-visible)': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			'&[data-disabled]': { cursor: 'default', opacity: 0.5 },
		},
	}),
);
