import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

export const root = style({
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-word',
	pointerEvents: 'none',
});

export const facet = style({
	color: vars.palette.primary_500,
});

export const emoji = style({
	fontSize: `calc(${fontSize.md} * 1.85)`,
});
