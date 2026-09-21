import { style, styleVariants } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { borderRadius, iconSize, space } from '#/styles/tokens.css';

import { revealOnHover } from '../reveal.css';

const bordered = style({
	border: `1px solid ${colors.borderContrastLow}`,
	borderRadius: borderRadius.md,
});

export const frame = styleVariants({
	bare: { position: 'relative' },
	card: [bordered, { position: 'relative', overflow: 'hidden' }],
	notice: [
		bordered,
		{
			display: 'flex',
			alignItems: 'center',
			gap: space.xs,
			padding: space.sm,
			paddingLeft: space.md,
			backgroundColor: vars.palette.contrast_25,
		},
	],
});

export const actions = style([
	revealOnHover,
	{
		position: 'absolute',
		top: space.xs,
		right: space.xs,
	},
]);

export const noticeActions = style({
	marginLeft: 'auto',
});

export const notice = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.sm,
	minWidth: 0,
	color: vars.palette.contrast_500,
});

export const noticeIcon = style({
	flexShrink: 0,
	width: iconSize.sm,
	height: iconSize.sm,
});

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	padding: `${space.sm}px ${space.md}px`,
});

export const skeletonThumb = style({
	aspectRatio: '1.91 / 1',
	backgroundColor: vars.palette.contrast_50,
});

export const placeholder = style({
	padding: space.md,
});

export const status = style({
	display: 'flex',
	alignItems: 'center',
	gap: space.xs,
	marginTop: space.xs,
});
