import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const header = style({
	paddingInline: space._2xl,
	paddingTop: space.xl,
});

export const headerRow = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'space-between',
	paddingBottom: space.lg,
});

export const subHeaderRow = style({
	alignItems: 'center',
	borderBottom: `1px solid ${vars.palette.contrast_200}`,
	display: 'flex',
	justifyContent: 'space-between',
	paddingBottom: space.md,
});

// pull the ghost close button flush with the dialog edge.
export const closeButton = style({
	margin: -space.sm,
});

// floored so the dialog keeps a stable height instead of shrinking to a short list.
export const list = style({
	minHeight: 500,
	paddingInline: space._2xl,
});

export const item = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.md,
	justifyContent: 'space-between',
	paddingBlock: space.md,
});

export const itemInfo = style({
	flex: 1,
	minWidth: 0,
});

export const itemMeta = style({
	alignItems: 'center',
	display: 'flex',
	marginTop: space.xs,
});

export const moreCount = style({
	marginLeft: space.xs,
});

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: 500,
});

export const empty = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xl,
	paddingTop: 100,
});

export const emptyText = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});
