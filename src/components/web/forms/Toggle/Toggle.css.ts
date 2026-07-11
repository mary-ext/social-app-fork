import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontSize } from '#/styles/tokens.css';

const itemReset = style(
	layered(components, {
		alignItems: 'center',
		appearance: 'none',
		background: 'transparent',
		border: 'none',
		color: 'inherit',
		cursor: 'pointer',
		display: 'flex',
		flexDirection: 'row',
		gap: 8,
		margin: 0,
		padding: 0,
		textAlign: 'left',
		selectors: {
			'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			'&[data-disabled]': { cursor: 'default' },
		},
	}),
);

export const item = style([itemReset, layered(components, { width: '100%' })]);

export const radioItem = style([itemReset, layered(components, { flex: 1 })]);

export const panelGroup = style(
	layered(components, {
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
		width: '100%',
	}),
);

export const panel = recipe(
	{
		base: {
			alignItems: 'center',
			backgroundColor: vars.palette.contrast_50,
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			gap: 8,
			minHeight: 48,
			paddingBlock: 12,
			paddingInline: 12,
			width: '100%',
			selectors: {
				'[data-checked] &': { backgroundColor: vars.palette.primary_50 },
			},
		},
		variants: {
			active: {
				false: {},
				true: { backgroundColor: vars.palette.primary_50 },
			},
			adjacent: {
				both: { borderRadius: 4 },
				leading: {
					borderTopLeftRadius: 4,
					borderTopRightRadius: 4,
					borderBottomLeftRadius: 12,
					borderBottomRightRadius: 12,
				},
				none: { borderRadius: 12 },
				trailing: {
					borderTopLeftRadius: 12,
					borderTopRightRadius: 12,
					borderBottomLeftRadius: 4,
					borderBottomRightRadius: 4,
				},
			},
			size: {
				default: {},
				small: {
					gap: 4,
					minHeight: 0,
					paddingBlock: 8,
					paddingInline: 8,
					'@media': {
						'(min-width: 800px)': { paddingInline: 12 },
					},
				},
			},
		},
		compoundVariants: [
			{
				size: 'small',
				style: {
					borderBottomLeftRadius: 8,
					borderBottomRightRadius: 8,
					borderTopLeftRadius: 8,
					borderTopRightRadius: 8,
				},
			},
		],
		defaultVariants: { active: false, adjacent: 'none', size: 'default' },
	},
	{ debugId: 'panel', layer: components },
);

export const panelTextWithIcon = style(
	layered(components, {
		alignItems: 'center',
		display: 'flex',
		flex: 1,
		flexDirection: 'row',
		gap: 4,
	}),
);

export const panelText = style(
	layered(components, {
		color: vars.palette.contrast_700,
		flex: 1,
		fontSize: fontSize.md,
		lineHeight: roundToPx(`calc(${fontSize.md} * 1.3)`),
		selectors: {
			'[data-checked] &, [data-active] &': {
				color: vars.palette.contrast_1000,
				fontWeight: 500,
			},
			'[data-disabled] &': { color: vars.palette.contrast_500 },
			'[data-checked][data-disabled] &': { color: vars.palette.contrast_600 },
			'[data-size="small"] &': {
				fontSize: fontSize.md_sub,
				lineHeight: roundToPx(`calc(${fontSize.md_sub} * 1.3)`),
			},
		},
	}),
);

export const panelIcon = style(
	layered(components, {
		color: vars.palette.contrast_700,
		flexShrink: 0,
		selectors: {
			'[data-checked] &, [data-active] &': { color: vars.palette.contrast_1000 },
			'[data-size="small"] &': { height: 16, width: 16 },
		},
	}),
);

const indicatorBase = style(
	layered(components, {
		alignItems: 'center',
		backgroundColor: vars.palette.contrast_25,
		border: `1px solid ${vars.palette.contrast_100}`,
		boxSizing: 'border-box',
		display: 'flex',
		flexShrink: 0,
		height: 24,
		justifyContent: 'center',
		transitionDuration: '100ms',
		transitionProperty: 'background-color, border-color',
		width: 24,
		selectors: {
			'[data-checked] &': {
				backgroundColor: vars.palette.primary_500,
				borderColor: vars.palette.primary_500,
			},
			'[data-disabled] &': {
				backgroundColor: vars.palette.contrast_100,
				borderColor: vars.palette.contrast_400,
			},
			'[data-checked][data-disabled] &': {
				backgroundColor: vars.palette.primary_100,
				borderColor: vars.palette.contrast_400,
			},
		},
	}),
);

export const circle = style([indicatorBase, layered(components, { borderRadius: 999 })]);

export const dot = style(
	layered(components, {
		backgroundColor: vars.palette.white,
		borderRadius: 999,
		height: 12,
		width: 12,
		selectors: {
			'[data-disabled] &': { backgroundColor: vars.palette.contrast_600 },
		},
	}),
);

export const box = style([
	indicatorBase,
	layered(components, { borderRadius: 6, color: vars.palette.white }),
]);

export const check = style(
	layered(components, {
		alignItems: 'center',
		display: 'flex',
		justifyContent: 'center',
	}),
);

export const switchTrack = style(
	layered(components, {
		alignItems: 'center',
		backgroundColor: vars.palette.contrast_200,
		borderRadius: 999,
		boxSizing: 'border-box',
		display: 'flex',
		flexShrink: 0,
		height: 28,
		padding: 3,
		transitionDuration: '100ms',
		transitionProperty: 'background-color',
		width: 48,
		selectors: {
			'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
		},
	}),
);

export const switchThumb = style(
	layered(components, {
		backgroundColor: vars.palette.white,
		borderRadius: 999,
		height: 22,
		transitionDuration: '100ms',
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
		width: 22,
		selectors: {
			'[data-checked] &': { transform: 'translateX(20px)' },
		},
	}),
);
