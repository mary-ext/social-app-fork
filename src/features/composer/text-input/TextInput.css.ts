import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { space, zIndex } from '#/styles/tokens.css';

export const dropScrim = recipe(
	{
		base: {
			display: 'flex',
			position: 'fixed',
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
			alignItems: 'center',
			justifyContent: 'center',
			transitionDuration: '150ms',
			transitionProperty: 'opacity',
			transitionTimingFunction: 'ease-in-out',
			opacity: 0,
			zIndex: zIndex.modal,
			backgroundColor: 'rgba(0, 0, 0, 0.7)',
			padding: space.lg,
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
		display: 'flex',
		flexDirection: 'column',
		border: `1px solid ${colors.borderContrastLow}`,
		borderRadius: 16,
		boxShadow: 'rgba(0, 0, 0, 0.3) 0px 5px 20px',
		backgroundColor: vars.palette.contrast_0,
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
