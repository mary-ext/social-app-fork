import { style } from '@vanilla-extract/css';

import { fontSize, space } from '#/styles/tokens.css';

export const label = style({
	paddingTop: space.sm,
	paddingBottom: space._2xs,
	paddingInline: space.md,
	textTransform: 'uppercase',
	letterSpacing: 0.4,
	fontSize: fontSize.xs,

	fontWeight: 700,

	':first-child': {
		paddingTop: space.xs,
	},
});
