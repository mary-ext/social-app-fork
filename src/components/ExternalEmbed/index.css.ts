import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	transitionProperty: 'border-color',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.md,
	borderColor: vars.palette.contrast_100,
	backgroundColor: colors.bg,
	width: '100%',
	overflow: 'hidden',
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover': { borderColor: vars.palette.contrast_300 },
		'&:focus-visible, &:has(a:focus-visible)': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const body = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	gap: 3,
	paddingTop: space.sm,
});

export const bodyLink = style({
	textDecoration: 'none',
	color: 'inherit',
	selectors: {
		'&:focus-visible': { outline: 'none' },
	},
});

export const bodyWithMedia = style({
	transitionProperty: 'border-color',
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: vars.palette.contrast_100,
	selectors: {
		[`${card}:hover &`]: { borderTopColor: vars.palette.contrast_300 },
	},
});

export const titleBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 4,
	paddingRight: space.md,
	paddingBottom: space.xs,
	paddingLeft: space.md,
});

export const domainWrap = style({
	paddingRight: space.md,
	paddingLeft: space.md,
});

export const divider = style({
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: vars.palette.contrast_100,
	width: '100%',
});

export const domainRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
	paddingTop: 6,
	paddingBottom: space.sm,
});

export const globe = style({
	transitionProperty: 'color',
	color: vars.palette.contrast_400,
	selectors: {
		[`${card}:hover &`]: { color: vars.palette.contrast_700 },
	},
});

export const domain = style({
	transitionProperty: 'color',
	color: vars.palette.contrast_700,
	selectors: {
		[`${card}:hover &`]: { color: vars.palette.contrast_900 },
	},
});
