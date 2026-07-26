import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const headingLink = style({
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	gap: space.md,
});

export const headingRow = style({
	position: 'relative',
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	gap: space.sm,
});

export const headingOverlay = style({
	position: 'absolute',
	inset: 0,
	zIndex: 1,
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${colors.primary_500}`,
			outlineOffset: -2,
		},
	},
});

export const avatarLayer = style({
	position: 'relative',
	zIndex: 2,
});

export const nameRow = style({
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	alignItems: 'center',
});

export const name = style({
	flexShrink: 1,
});

export const badgePad = style({
	paddingLeft: space.xs,
});
