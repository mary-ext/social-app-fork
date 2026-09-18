import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const status = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: space.md,
	paddingBlock: space._4xl,
});

export const listHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	paddingBottom: space.lg,
	paddingInline: space.lg,
});

export const chips = style({
	flex: 1,
	minWidth: 0,
});

export const selectAll = style({
	alignSelf: 'flex-start',
});

export const selectionRow = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.md,
});

export const footerContent = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: space.md,
});
