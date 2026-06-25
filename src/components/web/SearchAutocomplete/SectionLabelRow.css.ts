import { style } from '@vanilla-extract/css';

import { fontSize, space } from '#/styles/tokens.css';

export const label = style({
	fontSize: fontSize.xs,
	fontWeight: 700,
	letterSpacing: 0.4,
	paddingTop: space.sm,
	paddingBottom: space._2xs,
	paddingInline: space.md,

	textTransform: 'uppercase',

	':first-child': {
		paddingTop: space.xs,
	},
});
