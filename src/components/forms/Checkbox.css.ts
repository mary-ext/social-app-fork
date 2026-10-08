import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { layered } from '#/styles/layers';
import { components } from '#/styles/layers.css';
import { borderRadius } from '#/styles/tokens.css';

export const root = style(
	layered(components, {
		appearance: 'none',
		display: 'inline-flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 0,
		border: 'none',
		borderRadius: borderRadius.sm,
		backgroundColor: 'transparent',
		padding: 0,
		minHeight: 36,
		cursor: 'pointer',
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			'&[data-disabled]': { cursor: 'default', opacity: 0.5 },
		},
	}),
);
