import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { iconSize, space } from '#/styles/tokens.css';

export const container = style({
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: space.md,
	paddingInline: space.lg,
});

export const trigger = style({
	alignSelf: 'start',
	gap: space.sm,
	marginLeft: -space.sm,
	paddingBlock: space.xs,
	paddingInline: space.sm,
	maxWidth: '100%',
});

export const chevron = style({
	flexShrink: 0,
	width: iconSize.xs,
	height: iconSize.xs,
	transitionDuration: '150ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'[data-popup-open] &': { transform: 'rotate(180deg)' },
	},
});
