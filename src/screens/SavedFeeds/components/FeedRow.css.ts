import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const row = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	gap: space.lg,
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	backgroundColor: colors.bg,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const dragOverlay = style({
	position: 'absolute',
	inset: 0,
	backgroundColor: colors.contrast_25,
	pointerEvents: 'none',
});

export const indicator = recipe(
	{
		base: {
			position: 'absolute',
			insetInline: 0,
			zIndex: 1,
			backgroundColor: colors.primary_500,
			height: 2,
			pointerEvents: 'none',
		},
		variants: {
			edge: {
				bottom: { bottom: 0 },
				top: { top: 0 },
			},
		},
	},
	{ debugId: 'indicator' },
);

export const actions = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.sm,
	marginInline: -8,
});

export const handle = style({
	cursor: 'grab',
	touchAction: 'none',
	userSelect: 'none',
});
