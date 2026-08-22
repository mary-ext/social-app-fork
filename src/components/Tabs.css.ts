import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize, iconSize, space, zIndex } from '#/styles/tokens.css';

export const root = style(
	layered(components, {
		display: 'flex',
		flex: 1,
		flexDirection: 'column',
	}),
);

export const bar = style(
	layered(components, {
		display: 'flex',
		position: 'sticky',
		top: 0,
		alignItems: 'stretch',
		flexDirection: 'row',
		zIndex: zIndex.raised,
		borderBottom: `1px solid ${vars.palette.contrast_100}`,
		backgroundColor: vars.palette.contrast_0,
	}),
);

export const list = style(
	layered(components, {
		display: 'flex',
		flex: '1 1 auto',
		flexDirection: 'row',
		minWidth: 0,
		overflowX: 'auto',
		scrollbarWidth: 'none',
		userSelect: 'none',
		selectors: {
			'&::-webkit-scrollbar': { display: 'none' },
		},
	}),
);

export const actions = style({
	display: 'flex',
	flexShrink: 0,
	alignItems: 'center',
	paddingInline: space.md,
});

const tabPaddingBlock = 12;

export const tab = style(
	layered(components, {
		appearance: 'none',
		display: 'flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 0,
		border: 'none',
		background: 'transparent',
		paddingBlock: tabPaddingBlock,
		paddingInline: 16,
		whiteSpace: 'nowrap',
		color: vars.palette.contrast_700,
		fontSize: fontSize.md,
		fontWeight: 600,
		cursor: 'pointer',
		selectors: {
			'&:hover': { backgroundColor: vars.palette.contrast_25 },
			'&[data-active]': { color: vars.palette.contrast_1000 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	}),
);

export const tabVariant = styleVariants({
	fill: { '@layer': { [components]: { flexGrow: 1 } } },
	hug: {},
});

export const tabContent = style({
	display: 'flex',
	position: 'relative',
	alignItems: 'center',
	gap: space.sm,
	'::after': {
		position: 'absolute',
		right: -4,
		bottom: -tabPaddingBlock,
		left: -4,
		backgroundColor: 'transparent',
		height: 3,
		content: '""',
	},
	selectors: {
		[`${tab}[data-active] &::after`]: { backgroundColor: vars.palette.primary_500 },
	},
});

export const tabIcon = style({
	flexShrink: 0,
	width: iconSize.sm,
	height: iconSize.sm,
});

export const panel = style(
	layered(components, {
		flex: 1,
	}),
);
