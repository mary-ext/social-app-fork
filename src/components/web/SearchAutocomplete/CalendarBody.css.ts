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

// the month nav shares the root's 7-column track: a chevron in each end column and the label spanning
// the five between them, all sat in the grid's first row above the calendar.
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

// the labels and day cells flow into the shared root grid; this wrapper is only the presentational
// grouping for the weekday header.
export const weekdays = style({
	display: 'contents',
});

export const weekday = style({
	fontSize: fontSize.xs,
	paddingBlock: 4,
	textAlign: 'center',
});

// the role="row" wrapper survives for grid navigation; its day cells flow into the shared root grid.
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
			// fixed-size circle centered within its (wider) grid column.
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
			// filled accent for the day already entered in the query.
			selected: {
				true: {
					backgroundColor: vars.palette.primary_500,
					selectors: {
						'&[data-highlighted]': { backgroundColor: vars.palette.primary_600 },
					},
				},
			},
			// ring around the current day.
			today: {
				true: {
					boxShadow: `inset 0 0 0 1px ${vars.palette.contrast_400}`,
				},
			},
		},
	},
	{ debugId: 'day' },
);
