import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const root = style({
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	padding: space._2xl,
	background: colors.bg,
});

// feathers the seam between the scrolling message list and this pinned footer.
export const gradient = style({
	position: 'absolute',
	top: -16,
	left: 0,
	right: 0,
	height: 16,
	backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.08))',
	pointerEvents: 'none',
});

export const inviterRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.sm,
});

export const inviterColumn = style({
	flex: 1,
	minWidth: 0,
});

export const inviterName = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
});

export const badgePad = style({
	paddingLeft: space.xs,
});

export const handle = style({
	paddingTop: space.xs,
});

export const actionRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	width: '100%',
});

export const actionRowTopPad = style({
	paddingTop: space.sm,
});

export const acceptRow = style({
	display: 'flex',
	flexDirection: 'row',
	width: '100%',
});

export const grow = style({
	flex: 1,
});
