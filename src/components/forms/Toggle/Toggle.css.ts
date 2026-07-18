import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { roundToPx } from '#/styles/round';
import { fontSize } from '#/styles/tokens.css';

const itemReset = style(
	layered(components, {
		appearance: 'none',
		display: 'flex',
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
		margin: 0,
		border: 'none',
		background: 'transparent',
		padding: 0,
		textAlign: 'left',
		color: 'inherit',
		cursor: 'pointer',
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
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'row',
			gap: 8,
			alignItems: 'center',
			backgroundColor: vars.palette.contrast_50,
			paddingBlock: 12,
			paddingInline: 12,
			width: '100%',
			minHeight: 48,
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
					paddingBlock: 8,
					paddingInline: 8,
					minHeight: 0,
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
					borderTopLeftRadius: 8,
					borderTopRightRadius: 8,
					borderBottomLeftRadius: 8,
					borderBottomRightRadius: 8,
				},
			},
		],
		defaultVariants: { active: false, adjacent: 'none', size: 'default' },
	},
	{ debugId: 'panel', layer: components },
);

export const panelTextWithIcon = style(
	layered(components, {
		display: 'flex',
		flex: 1,
		flexDirection: 'row',
		gap: 4,
		alignItems: 'center',
	}),
);

export const panelText = style(
	layered(components, {
		flex: 1,
		lineHeight: roundToPx(`calc(${fontSize.md} * 1.3)`),
		color: vars.palette.contrast_700,
		fontSize: fontSize.md,
		selectors: {
			'[data-checked] &, [data-active] &': {
				color: vars.palette.contrast_1000,
				fontWeight: 500,
			},
			'[data-disabled] &': { color: vars.palette.contrast_500 },
			'[data-checked][data-disabled] &': { color: vars.palette.contrast_600 },
			'[data-size="small"] &': {
				lineHeight: roundToPx(`calc(${fontSize.md_sub} * 1.3)`),
				fontSize: fontSize.md_sub,
			},
		},
	}),
);

export const panelIcon = style(
	layered(components, {
		flexShrink: 0,
		color: vars.palette.contrast_700,
		selectors: {
			'[data-checked] &, [data-active] &': { color: vars.palette.contrast_1000 },
			'[data-size="small"] &': { width: 16, height: 16 },
		},
	}),
);

const indicatorBase = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		flexShrink: 0,
		alignItems: 'center',
		justifyContent: 'center',
		transitionDuration: '100ms',
		transitionProperty: 'background-color, border-color',
		border: `1px solid ${vars.palette.contrast_100}`,
		backgroundColor: vars.palette.contrast_25,
		width: 24,
		height: 24,
		selectors: {
			'[data-checked] &': {
				borderColor: vars.palette.primary_500,
				backgroundColor: vars.palette.primary_500,
			},
			'[data-disabled] &': {
				borderColor: vars.palette.contrast_400,
				backgroundColor: vars.palette.contrast_100,
			},
			'[data-checked][data-disabled] &': {
				borderColor: vars.palette.contrast_400,
				backgroundColor: vars.palette.primary_100,
			},
		},
	}),
);

export const circle = style([indicatorBase, layered(components, { borderRadius: 999 })]);

export const dot = style(
	layered(components, {
		borderRadius: 999,
		backgroundColor: vars.palette.white,
		width: 12,
		height: 12,
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
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}),
);

export const switchTrack = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		flexShrink: 0,
		alignItems: 'center',
		transitionDuration: '100ms',
		transitionProperty: 'background-color',
		borderRadius: 999,
		backgroundColor: vars.palette.contrast_200,
		padding: 3,
		width: 48,
		height: 28,
		selectors: {
			'[data-checked] &': { backgroundColor: vars.palette.primary_500 },
		},
	}),
);

export const switchThumb = style(
	layered(components, {
		transitionDuration: '100ms',
		transitionProperty: 'transform',
		transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
		borderRadius: 999,
		backgroundColor: vars.palette.white,
		width: 22,
		height: 22,
		selectors: {
			'[data-checked] &': { transform: 'translateX(20px)' },
		},
	}),
);
