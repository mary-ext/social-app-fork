import { createVar, style } from '@vanilla-extract/css';

import { CENTER_COLUMN_WIDTH } from '#/components/web/Layout/const';

import { vars } from '#/styles/contract.css';
import { zIndex } from '#/styles/tokens.css';

const CENTER_COLUMN_FRAME = CENTER_COLUMN_WIDTH + 2;

export const bottomBarHeightVar = createVar();

export const root = style({
	display: 'flex',
	flexDirection: 'column',
	flexShrink: 0,
	minHeight: '100dvh',
	width: '100%',
});

export const body = style({
	display: 'grid',
	flex: '1 0 auto',
	gridTemplateColumns: 'auto minmax(0, 100%) auto',
	justifyContent: 'center',
	minWidth: 0,
	'@media': {
		'screen and (min-width: 800px)': {
			gridTemplateColumns: `1fr minmax(0, ${CENTER_COLUMN_FRAME}px) 1fr`,
		},
	},
});

export const rail = style({
	alignSelf: 'start',
	display: 'flex',
	flexDirection: 'column',
	maxHeight: '100dvh',
	overflowY: 'auto',
	position: 'sticky',
	scrollbarWidth: 'thin',
	top: 0,
});

export const railLeft = style({
	justifySelf: 'end',
	minWidth: 'max-content',
});

export const railRight = style({
	justifySelf: 'start',
});

export const railRightFluid = style({
	maxWidth: 300 + 24 * 2,
	minWidth: 280,
	width: '100%',
});

export const main = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
	'@media': {
		'screen and (min-width: 800px)': {
			borderLeft: `1px solid ${vars.palette.contrast_100}`,
			borderRight: `1px solid ${vars.palette.contrast_100}`,
		},
	},
});

export const bottomBar = style({
	bottom: 0,
	position: 'sticky',
	width: '100%',
	zIndex: zIndex.sticky,
});

export const rootFixed = style({
	height: '100dvh',
	overflow: 'hidden',
});

export const bodyFixed = style({
	flex: 1,
	gridTemplateRows: '1fr',
	minHeight: 0,
});

export const bodyWide = style({
	'@media': {
		'screen and (min-width: 800px)': {
			gridTemplateColumns: '1fr auto 1fr',
			transform: 'translateX(20px)',
		},
		'screen and (min-width: 1100px) and (max-width: 1300px)': {
			transform: 'translateX(40px)',
		},
	},
});

export const mainFixed = style({
	minHeight: 0,
	overflow: 'hidden',
});

export const mainPlain = style({
	'@media': {
		'screen and (min-width: 800px)': {
			borderLeft: 'none',
			borderRight: 'none',
		},
	},
});
