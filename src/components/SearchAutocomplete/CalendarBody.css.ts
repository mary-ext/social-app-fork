import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, fontSize, space } from '#/styles/tokens.css';

export const root = style({
	display: 'grid',
	gridTemplateColumns: 'repeat(7, 1fr)',
	paddingBlock: 4,
	paddingInline: 8,
});

const navButton = style({
	justifySelf: 'center',
	marginBottom: space.xs,
});

export const navPrevious = style([navButton, { gridColumnStart: 1 }]);

export const navNext = style([navButton, { gridColumnEnd: -1 }]);

export const month = style({
	alignSelf: 'center',
	color: vars.palette.contrast_1000,
	gridColumn: '2 / -2',
	textAlign: 'center',
});

export const weekdays = style({
	display: 'contents',
});

export const weekday = style({
	fontSize: fontSize.xs,
	paddingBlock: 4,
	textAlign: 'center',
});

export const week = style({
	display: 'contents',
});

export const day = recipe(
	{
		base: {
			alignItems: 'center',
			borderRadius: borderRadius.full,
			cursor: 'default',
			display: 'flex',
			height: 36,
			justifyContent: 'center',
			justifySelf: 'center',
			outline: 'none',
			userSelect: 'none',
			width: 36,
			selectors: {
				'&[data-highlighted]': { backgroundColor: vars.palette.contrast_50 },
				'&[data-disabled]': { pointerEvents: 'none' },
			},
		},
		variants: {
			selected: {
				true: {
					backgroundColor: vars.palette.primary_500,
					selectors: {
						'&[data-highlighted]': { backgroundColor: vars.palette.primary_600 },
					},
				},
			},
			today: {
				true: {
					boxShadow: `inset 0 0 0 1px ${vars.palette.contrast_400}`,
				},
			},
		},
	},
	{ debugId: 'day' },
);
