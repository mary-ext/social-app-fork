import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { mediaBorder } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const container = style([
	mediaBorder,
	{
		alignItems: 'center',
		backgroundColor: colors.contrast_25,
		borderRadius: borderRadius.md,
		display: 'flex',
		flex: 1,
		flexDirection: 'column',
		gap: space.lg,
		justifyContent: 'center',
		overflow: 'hidden',
		paddingInline: space.lg,
		position: 'relative',
	},
]);

export const text = style({
	color: colors.textContrastHigh,
	maxWidth: 300,
});
