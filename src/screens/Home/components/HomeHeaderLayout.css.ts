import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const trigger = style({
	alignSelf: 'start',
	gap: space.sm,
	marginLeft: -space.sm,
	paddingInline: space.sm,
	paddingBlock: space.xs,
	maxWidth: '100%',
});

export const chevron = style({
	flexShrink: 0,
	transitionDuration: '150ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'[data-popup-open] &': { transform: 'rotate(180deg)' },
	},
});
