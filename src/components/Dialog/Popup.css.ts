import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { components, layered } from '#/styles/layers.css';
import { recipe } from '#/styles/recipe';
import { space, zIndex } from '#/styles/tokens.css';

export const portal = style(
	layered(components, {
		zIndex: zIndex.modal,
	}),
);

export const backdrop = style(
	layered(components, {
		position: 'fixed',
		inset: 0,
		transitionDuration: '150ms',
		transitionProperty: 'opacity',
		backgroundColor: 'rgba(0, 0, 0, 0.8)',

		selectors: {
			'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
		},
	}),
);

export const viewport = style(
	layered(components, {
		boxSizing: 'border-box',
		display: 'flex',
		position: 'fixed',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: 'flex-start',
		justifyContent: 'center',
		paddingBlock: 20,
		paddingInline: 20,
		overflowY: 'auto',

		'@media': {
			'(min-width: 800px)': {
				paddingBlock: '10vh',
			},
		},
	}),
);

export const popup = recipe(
	{
		base: {
			boxSizing: 'border-box',
			position: 'relative',
			transitionDuration: '200ms',
			transitionProperty: 'opacity, transform',
			transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
			border: `1px solid ${vars.palette.contrast_200}`,
			borderRadius: 12,
			boxShadow: vars.shadow.dialog,
			backgroundColor: vars.palette.contrast_0,
			padding: 24,
			width: '100%',
			selectors: {
				'&[data-starting-style], &[data-ending-style]': { transform: 'scale(0.95)', opacity: 0 },
			},
		},
		variants: {
			fullHeight: {
				true: { height: '80vh' },
			},
			padding: {
				default: {},
				none: { padding: 0 },
			},
			scroll: {
				body: {
					display: 'flex',
					flexDirection: 'column',
					padding: 0,
					maxHeight: '80vh',
					overflow: 'hidden',
				},
				viewport: {},
			},
			size: {
				default: { maxWidth: 600 },
				medium: { maxWidth: 460 },
				narrow: { maxWidth: 400 },
				wide: { maxWidth: 520 },
			},
		},
		defaultVariants: { fullHeight: false, padding: 'default', scroll: 'viewport', size: 'default' },
	},
	{ debugId: 'popup', layer: components },
);

export const body = style(
	layered(components, {
		flex: 1,
		minHeight: 0,
		overflowY: 'auto',
	}),
);

export const footer = style(
	layered(components, {
		boxSizing: 'border-box',
		flexShrink: 0,
		borderTop: `1px solid ${vars.palette.contrast_200}`,
		backgroundColor: vars.palette.contrast_0,
		paddingBlock: 12,
		paddingInline: 16,
	}),
);

export const titleRow = style(
	layered(components, {
		display: 'flex',
		flexDirection: 'row',
		gap: space.sm,
	}),
);

export const title = style(
	layered(components, {
		minWidth: 0,
		selectors: {
			[`${titleRow} &`]: {
				flexGrow: 1,
			},
		},
	}),
);

export const actions = recipe(
	{
		base: {
			display: 'flex',
			gap: space.sm,
		},
		variants: {
			align: {
				between: {},
				center: {},
				end: {},
			},
			direction: {
				column: { flexDirection: 'column' },
				responsive: {
					flexDirection: 'column',
					'@media': {
						'(min-width: 800px)': { flexDirection: 'row' },
					},
				},
				row: { flexDirection: 'row' },
			},
			reverse: {
				false: {},
				true: {},
			},
		},
		compoundVariants: [
			{ direction: 'column', reverse: true, style: { flexDirection: 'column-reverse' } },
			{ direction: 'row', reverse: true, style: { flexDirection: 'row-reverse' } },
			{
				direction: 'responsive',
				reverse: true,
				style: {
					flexDirection: 'column-reverse',
					'@media': {
						'(min-width: 800px)': { flexDirection: 'row' },
					},
				},
			},
			{ align: 'between', direction: 'row', style: { justifyContent: 'space-between' } },
			{ align: 'center', direction: 'row', style: { justifyContent: 'center' } },
			{ align: 'end', direction: 'row', style: { justifyContent: 'flex-end' } },
			{
				align: 'between',
				direction: 'responsive',
				style: { '@media': { '(min-width: 800px)': { justifyContent: 'space-between' } } },
			},
			{
				align: 'center',
				direction: 'responsive',
				style: { '@media': { '(min-width: 800px)': { justifyContent: 'center' } } },
			},
			{
				align: 'end',
				direction: 'responsive',
				style: { '@media': { '(min-width: 800px)': { justifyContent: 'flex-end' } } },
			},
		],
		defaultVariants: { align: 'end', direction: 'row', reverse: false },
	},
	{ debugId: 'actions', layer: components },
);

export const divider = style(
	layered(components, {
		borderTop: `1px solid ${vars.palette.contrast_100}`,
		width: '100%',
	}),
);

export const close = recipe(
	{
		base: {
			appearance: 'none',
			display: 'inline-flex',
			flexShrink: 0,
			alignItems: 'center',
			justifyContent: 'center',
			border: 'none',
			borderRadius: 999,
			backgroundColor: vars.palette.contrast_0,
			width: 32,
			height: 32,
			color: vars.palette.contrast_600,
			cursor: 'pointer',
			selectors: {
				'&:hover': { backgroundColor: vars.palette.contrast_50 },
				'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
			},
		},
		variants: {
			variant: {
				default: {
					margin: -8,
				},
				floating: {
					position: 'absolute',
					top: 12,
					right: 12,
					zIndex: zIndex.raised,
				},
				outer: {
					position: 'fixed',
					top: 12,
					right: 12,
					transitionDuration: '200ms',
					transitionProperty: 'opacity',
					transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
					zIndex: zIndex.raised,
					selectors: {
						[`${viewport}[data-starting-style] &, ${viewport}[data-ending-style] &`]: { opacity: 0 },
					},
				},
			},
		},
		defaultVariants: { variant: 'default' },
	},
	{ debugId: 'close', layer: components },
);
