import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const card = style({
	backgroundColor: colors.bg,
	borderColor: vars.palette.contrast_100,
	borderRadius: borderRadius.md,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	textDecoration: 'none',
	transitionProperty: 'border-color',
	width: '100%',
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
	color: 'inherit',
	textDecoration: 'none',
	selectors: {
		'&:focus-visible': { outline: 'none' },
	},
});

export const bodyWithMedia = style({
	borderTopColor: vars.palette.contrast_100,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	transitionProperty: 'border-color',
	selectors: {
		[`${card}:hover &`]: { borderTopColor: vars.palette.contrast_300 },
	},
});

export const titleBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 4,
	paddingBottom: space.xs,
	paddingLeft: space.md,
	paddingRight: space.md,
});

export const domainWrap = style({
	paddingLeft: space.md,
	paddingRight: space.md,
});

export const divider = style({
	borderTopColor: vars.palette.contrast_100,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	width: '100%',
});

export const domainRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	paddingBottom: space.sm,
	paddingTop: 6,
});

export const globe = style({
	color: vars.palette.contrast_400,
	transitionProperty: 'color',
	selectors: {
		[`${card}:hover &`]: { color: vars.palette.contrast_700 },
	},
});

export const domain = style({
	color: vars.palette.contrast_700,
	transitionProperty: 'color',
	selectors: {
		[`${card}:hover &`]: { color: vars.palette.contrast_900 },
	},
});
