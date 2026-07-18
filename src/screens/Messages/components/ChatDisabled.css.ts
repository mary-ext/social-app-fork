import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const outer = style({ padding: space.md });

export const card = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.contrast_50,
			padding: space.lg,
		},
		variants: {
			shape: {
				banner: {},
				pill: { borderRadius: 40 },
			},
		},
		defaultVariants: { shape: 'pill' },
	},
	{ debugId: 'chat-disabled-card' },
);

export const warningIcon = style({ marginBottom: space.xs });

export const title = style({ marginBottom: space.xs });

export const appealButton = style({ marginTop: space.lg, width: '100%' });
