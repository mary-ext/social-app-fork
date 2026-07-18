import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space, zIndex } from '#/styles/tokens.css';

export const outer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	marginInline: 'auto',
	minHeight: 52,
	paddingBlock: space.xs,
	paddingInline: space.lg,
	position: 'sticky',
	top: 0,
	width: '100%',
	zIndex: zIndex.raised,
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
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	insetInline: 0,
	minHeight: 51,
	paddingBottom: space.xs,
	paddingInline: space.lg,
	// inset the header below the notch; the banner behind covers the safe area itself
	paddingTop: `calc(${space.xs}px + env(safe-area-inset-top, 0px))`,
	position: 'absolute',
	top: 0,
	zIndex: zIndex.raised,
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	justifyContent: 'center',
});

export const slot = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	flexShrink: 0,

	':first-child': {
		marginLeft: -space.sm,
	},
	':last-child': {
		marginRight: -space.sm,
	},
});
