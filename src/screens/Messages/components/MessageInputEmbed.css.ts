import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

const sharedContainer = {
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	position: 'relative',
	marginTop: space.sm,
	marginInline: space.sm,
	border: `1px solid ${colors.borderContrastHigh}`,
	borderRadius: borderRadius.md,
} as const;

export const container = style({
	...sharedContainer,
	padding: space.sm,
});

export const simpleContainer = style({
	...sharedContainer,
	minHeight: 80,
	alignItems: 'center',
	justifyContent: 'center',
});

export const metaRow = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.sm,
});

export const metaColumn = style({
	flex: 1,
	minWidth: 0,
	paddingBottom: space.xs,
});

export const removeButton = style({
	appearance: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingInline: space._2xs,
	transform: 'translateY(-2px)',
	border: 'none',
	background: 'none',
	cursor: 'pointer',
});

export const removeButtonFloating = style({
	position: 'absolute',
	top: 10,
	right: 8,
});

export const italic = style({
	fontStyle: 'italic',
});

export const embed = style({
	marginTop: space.sm,
});

export const postAlerts = style({
	paddingBlock: space.xs,
});

export const inviteState = style({
	minHeight: 64,
});
