import { layeredStyle } from '#/components/web/css/layered-style';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

export const trigger = layeredStyle({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	border: `1px solid ${vars.palette.contrast_50}`,
	borderRadius: 10,
	boxSizing: 'border-box',
	color: vars.palette.contrast_1000,
	cursor: 'pointer',
	display: 'flex',
	fontSize: fontSize.sm,
	gap: 8,
	justifyContent: 'space-between',
	maxWidth: 400,
	outline: 0,
	paddingBlock: 8,
	paddingInline: 12,
	width: '100%',
	selectors: {
		'&:focus-visible': { borderColor: vars.palette.primary_500 },
		'&[data-popup-open]': { borderColor: vars.palette.primary_500 },
	},
});

export const value = layeredStyle({
	overflow: 'hidden',
	textAlign: 'left',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export const icon = layeredStyle({
	alignItems: 'center',
	color: vars.palette.contrast_1000,
	display: 'flex',
	flexShrink: 0,
});

export const positioner = layeredStyle({
	zIndex: 10,
});

export const popup = layeredStyle({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxShadow: vars.shadow.md,
	boxSizing: 'border-box',
	maxHeight: 'var(--available-height)',
	overflowY: 'auto',
});

export const list = layeredStyle({
	padding: 4,
});

export const item = layeredStyle({
	alignItems: 'center',
	borderRadius: 4,
	color: vars.palette.contrast_1000,
	cursor: 'pointer',
	display: 'flex',
	fontSize: fontSize.sm,
	minHeight: 25,
	outline: 0,
	paddingBlock: 2,
	paddingLeft: 30,
	paddingRight: 8,
	position: 'relative',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color',
	userSelect: 'none',
	selectors: {
		'&[data-highlighted]': { backgroundColor: vars.palette.primary_50 },
		'&[data-selected]': { fontWeight: 600 },
	},
});

export const indicator = layeredStyle({
	alignItems: 'center',
	color: vars.palette.primary_500,
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	position: 'absolute',
	width: 30,
});
