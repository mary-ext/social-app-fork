import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { space, zIndex } from '#/styles/tokens.css';

export const dropScrim = recipe(
	{
		base: {
			alignItems: 'center',
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			bottom: 0,
			display: 'flex',
			justifyContent: 'center',
			left: 0,
			opacity: 0,
			padding: space.lg,
			position: 'fixed',
			right: 0,
			top: 0,
			transitionDuration: '150ms',
			transitionProperty: 'opacity',
			transitionTimingFunction: 'ease-in-out',
			zIndex: zIndex.modal,
		},
		variants: {
			visible: {
				false: { opacity: 0 },
				true: { opacity: 1 },
			},
		},
	},
	{ debugId: 'dropScrim', layer: components },
);

export const dropCard = style(
	layered(components, {
		backgroundColor: vars.palette.contrast_0,
		border: `1px solid ${colors.borderContrastLow}`,
		borderRadius: 16,
		boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
		display: 'flex',
		flexDirection: 'column',
		padding: space.sm,
	}),
);

export const dropText = style(
	layered(components, {
		border: `2px dashed ${colors.borderContrastHigh}`,
		borderRadius: 8,
		paddingBlock: 44,
		paddingInline: 36,
		textAlign: 'center',
	}),
);
