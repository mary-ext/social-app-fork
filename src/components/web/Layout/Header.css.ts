import { style } from '@vanilla-extract/css';

import { HEADER_HEIGHT } from '#/components/web/Layout/const';

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
	minHeight: HEADER_HEIGHT,
});

export const outerNoBorder = style({
	borderBottomColor: 'transparent',
});

export const outerStatic = style({
	position: 'static',
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	justifyContent: 'center',
	minWidth: 0,
});

const slot = style({
	display: 'flex',
	flexShrink: 0,
	gap: space.sm,
	alignItems: 'center',
});

export const startSlot = style([slot, { marginInlineStart: -space.sm }]);

export const endSlot = style([slot, { marginInlineEnd: -space.sm }]);
