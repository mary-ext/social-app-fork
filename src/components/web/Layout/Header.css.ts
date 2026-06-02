import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

import {
	BUTTON_VISUAL_ALIGNMENT_OFFSET,
	CENTER_COLUMN_OFFSET,
	CENTER_COLUMN_WIDTH,
	HEADER_SLOT_SIZE,
	SCROLLBAR_OFFSET,
} from '#/components/web/Layout/const';

const offsetVar = createVar();

const scrollbarShift = `translateX(${SCROLLBAR_OFFSET})`;

export const outer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: '8px',
	marginInline: 'auto',
	maxWidth: `${CENTER_COLUMN_WIDTH}px`,
	minHeight: '52px',
	paddingBottom: '4px',
	paddingInline: '16px',
	paddingTop: '4px',
	position: 'sticky',
	top: 0,
	transform: `translateX(${offsetVar}) ${scrollbarShift}`,
	vars: { [offsetVar]: '0px' },
	width: '100%',
	zIndex: 10,
	'@media': {
		'screen and (min-width: 800px)': {
			paddingInline: '20px',
		},
	},
});

export const outerNoBorder = style({
	borderBottom: 'none',
});

export const outerStatic = style({
	position: 'static',
});

export const outerOffset = style({
	vars: { [offsetVar]: `${CENTER_COLUMN_OFFSET}px` },
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	justifyContent: 'center',
	minHeight: `${HEADER_SLOT_SIZE}px`,
});

export const slot = style({
	flexShrink: 0,
	width: `${HEADER_SLOT_SIZE}px`,
	zIndex: 50,
});

export const backButton = style({
	marginLeft: `-${BUTTON_VISUAL_ALIGNMENT_OFFSET}px`,
});
