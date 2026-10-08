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
	gridColumn: '2 / -2',
	alignSelf: 'center',
	textAlign: 'center',
	color: vars.palette.contrast_1000,
});

export const weekdays = style({
	display: 'contents',
});

export const weekday = style({
	paddingBlock: 4,
	textAlign: 'center',
	fontSize: fontSize.xs,
});

export const week = style({
	display: 'contents',
});

export const day = recipe(
	{
		base: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			justifySelf: 'center',
			outline: 'none',
			borderRadius: borderRadius.full,
			width: 36,
			height: 36,
			cursor: 'default',
			userSelect: 'none',
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
