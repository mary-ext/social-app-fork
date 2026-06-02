import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

/** Number of segments; sizes the sliding indicator to an equal fraction of the track. */
export const countVar = createVar();
/** Zero-based index of the selected segment; drives the indicator's horizontal offset. */
export const indexVar = createVar();

export const root = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: '14px',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	padding: '4px',
	position: 'relative',
	width: '100%',
});

export const slider = style({
	backgroundColor: vars.palette.contrast_0,
	borderRadius: '10px',
	bottom: '4px',
	// matches the original segmented control's hardcoded indicator shadow
	boxShadow: '0px 2px 4px 0px #0000000D',
	left: '4px',
	position: 'absolute',
	top: '4px',
	transitionDuration: '200ms',
	transitionProperty: 'transform',
	transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
	transform: `translateX(calc(${fallbackVar(indexVar, '0')} * 100%))`,
	width: `calc((100% - 8px) / ${fallbackVar(countVar, '1')})`,
});

export const item = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: '10px',
	boxSizing: 'border-box',
	color: vars.palette.contrast_400,
	cursor: 'pointer',
	display: 'flex',
	flex: 1,
	font: 'inherit',
	justifyContent: 'center',
	margin: 0,
	minHeight: '40px',
	paddingBlock: '4px',
	paddingInline: '8px',
	// keep segments above the absolutely-positioned slider
	position: 'relative',
	transitionDuration: '100ms',
	transitionProperty: 'color',
	selectors: {
		'&[data-checked]': { color: vars.palette.contrast_1000 },
		'&:hover:not([data-checked])': { color: vars.palette.contrast_700 },
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: '-2px' },
	},
});

export const text = style({
	fontSize: fontSize.md,
	fontWeight: 500,
	textAlign: 'center',
});
