import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const banner = style({ marginBottom: space.sm });

export const empty = style({ height: '100%', justifyContent: 'center', paddingBottom: 40 });

export const emptyTall = style({ height: '100%', justifyContent: 'center', paddingBottom: 120 });

export const errorMessage = style({
	maxWidth: 360,
	paddingBottom: space.xl,
});

export const errorTitle = style({
	paddingBottom: space.sm,
	paddingTop: space.md,
});

export const errorWrap = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	paddingTop: space._3xl,
});

// scroll container for the split-view left column.
export const splitScroller = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	scrollbarColor: `${vars.palette.contrast_100} transparent`,
	scrollbarWidth: 'thin',
});
