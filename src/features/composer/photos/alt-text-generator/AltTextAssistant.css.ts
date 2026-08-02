import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

// a rule rather than a card: boxing the panel off from the alt text field above it read as cramped
export const panel = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	paddingTop: space.lg,
});

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const headerText = style({
	flex: 1,
	minWidth: 0,
});

export const dismiss = style({
	margin: -6,
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const rowText = style({
	flex: 1,
	minWidth: 0,
});

export const questionList = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
});

export const action = style({
	width: '100%',
});

export const errorBox = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	borderRadius: borderRadius.sm,
	backgroundColor: vars.palette.negative_25,
	padding: space.sm,
});

export const sparkleIcon = style({
	width: iconSize.sm,
	height: iconSize.sm,
	color: colors.primary_500,
});
