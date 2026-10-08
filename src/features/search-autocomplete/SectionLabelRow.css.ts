import { style } from '@vanilla-extract/css';

import { fontSize, space } from '#/styles/tokens.css';

import { rowInsetPadding } from './shared.css';

export const label = style({
	paddingTop: space.sm,
	paddingBottom: space._2xs,
	paddingInline: rowInsetPadding,
	textTransform: 'uppercase',
	letterSpacing: 0.4,
	fontSize: fontSize.xs,

	fontWeight: 700,

	':first-child': {
		paddingTop: space.xs,
	},
});
