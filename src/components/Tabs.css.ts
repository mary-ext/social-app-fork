import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { fontSize, zIndex } from '#/styles/tokens.css';

export const root = style(
	layered(components, {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
	}),
);

export const list = style(
	layered(components, {
		backgroundColor: vars.palette.contrast_0,
		borderBottom: `1px solid ${vars.palette.contrast_100}`,
		display: 'flex',
		flexDirection: 'row',
		overflowX: 'auto',
		position: 'sticky',
		top: 0,
		zIndex: zIndex.raised,
		userSelect: 'none',
		scrollbarWidth: 'none',
		selectors: {
			'&::-webkit-scrollbar': { display: 'none' },
		},
	}),
);

const tabPaddingBlock = 12;

export const tab = style(
	layered(components, {
		alignItems: 'center',
		appearance: 'none',
		background: 'transparent',
		border: 'none',
		color: vars.palette.contrast_700,
		cursor: 'pointer',
		display: 'flex',
		flexGrow: 1,
		flexShrink: 0,
		fontSize: fontSize.md,
		fontWeight: 600,
		justifyContent: 'center',
		margin: 0,
		paddingBlock: tabPaddingBlock,
		paddingInline: 16,
		whiteSpace: 'nowrap',
		selectors: {
			'&:hover': { backgroundColor: vars.palette.contrast_25 },
			'&[data-active]': { color: vars.palette.contrast_1000 },
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
		},
	}),
);

export const tabLabel = style({
	position: 'relative',
	'::after': {
		backgroundColor: 'transparent',
		bottom: -tabPaddingBlock,
		content: '""',
		height: 3,
		left: -4,
		position: 'absolute',
		right: -4,
	},
	selectors: {
		'[data-active] &::after': { backgroundColor: vars.palette.primary_500 },
	},
});

export const panel = style(
	layered(components, {
		flex: 1,
	}),
);
