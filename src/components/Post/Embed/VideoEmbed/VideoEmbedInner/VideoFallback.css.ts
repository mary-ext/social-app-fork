import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const container = style([
	mediaBorder,
	{
		display: 'flex',
		position: 'relative',
		flex: 1,
		flexDirection: 'column',
		gap: space.lg,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: borderRadius.md,
		backgroundColor: colors.contrast_25,
		paddingInline: space.lg,
		overflow: 'hidden',
	},
]);

export const text = style({
	maxWidth: 300,
	color: colors.textContrastHigh,
});
