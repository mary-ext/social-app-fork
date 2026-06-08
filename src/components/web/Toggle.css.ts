import { vars } from '#/styles/contract.css';
import { componentStyle } from '#/styles/layers.css';
import { fontSize } from '#/styles/tokens.css';

export const group = componentStyle({
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	width: '100%',
});

export const row = componentStyle({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_50,
	border: 'none',
	borderRadius: 4,
	boxSizing: 'border-box',
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	margin: 0,
	minHeight: 48,
	paddingBlock: 12,
	paddingInline: 12,
	textAlign: 'left',
	width: '100%',
	selectors: {
		'&:first-child': { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
		'&:last-child': { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
		'&[data-checked]': { backgroundColor: vars.palette.primary_50 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: -2 },
	},
});

export const box = componentStyle({
	alignItems: 'center',
	border: `1px solid ${vars.palette.contrast_300}`,
	borderRadius: 6,
	boxSizing: 'border-box',
	color: vars.palette.white,
	display: 'flex',
	flexShrink: 0,
	height: 24,
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, border-color',
	width: 24,
	selectors: {
		[`${row}[data-checked] &`]: {
			backgroundColor: vars.palette.primary_500,
			borderColor: vars.palette.primary_500,
		},
	},
});

export const indicator = componentStyle({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
});

export const text = componentStyle({
	flex: 1,
	fontSize: fontSize.md,
	selectors: {
		[`${row}[data-checked] &`]: {
			color: vars.palette.contrast_1000,
			fontWeight: 500,
		},
	},
});

export const actionIcon = componentStyle({
	alignItems: 'center',
	color: 'inherit',
	display: 'flex',
	flexShrink: 0,
});
