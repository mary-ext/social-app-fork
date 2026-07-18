import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const banner = style({ marginBottom: space.sm });

export const empty = style({ justifyContent: 'center', paddingBottom: 40, height: '100%' });

export const emptyTall = style({ justifyContent: 'center', paddingBottom: 120, height: '100%' });

export const errorMessage = style({
	paddingBottom: space.xl,
	maxWidth: 360,
});

export const errorTitle = style({
	paddingTop: space.md,
	paddingBottom: space.sm,
});

export const errorWrap = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	paddingTop: space._3xl,
});

export const splitScroller = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	scrollbarWidth: 'thin',
	scrollbarColor: `${vars.palette.contrast_100} transparent`,
});
