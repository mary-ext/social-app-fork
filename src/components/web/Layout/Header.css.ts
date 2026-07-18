import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space, zIndex } from '#/styles/tokens.css';

export const outer = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'sticky',
	top: 0,
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	zIndex: zIndex.raised,
	marginInline: 'auto',
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
	backgroundColor: vars.palette.contrast_0,
	paddingBlock: space.xs,
	paddingInline: space.lg,
	width: '100%',
	minHeight: 52,
});

export const outerNoBorder = style({
	borderBottom: 'none',
});

export const outerStatic = style({
	position: 'static',
});

export const bannerOuter = style({
	position: 'relative',
});

export const bannerHeader = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	insetInline: 0,
	top: 0,
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	zIndex: zIndex.raised,
	// inset the header below the notch; the banner behind covers the safe area itself
	paddingTop: `calc(${space.xs}px + env(safe-area-inset-top, 0px))`,
	paddingBottom: space.xs,
	paddingInline: space.lg,
	minHeight: 51,
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	justifyContent: 'center',
});

export const slot = style({
	display: 'flex',
	flexShrink: 0,
	gap: space.sm,
	alignItems: 'center',

	':first-child': {
		marginLeft: -space.sm,
	},
	':last-child': {
		marginRight: -space.sm,
	},
});
