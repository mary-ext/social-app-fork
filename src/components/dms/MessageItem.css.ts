import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const emojiBaselineNudge = style({ marginBottom: -space.sm });

export const reactionPill = style({
	appearance: 'none',
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
	alignItems: 'center',
	transform: 'translateY(-6px)',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.lg,
	boxShadow: vars.shadow.xs,
	backgroundColor: vars.palette.contrast_25,
	paddingBlock: 7,
	paddingInline: space.sm,
});

export const reactionPillButton = style({
	margin: 0,
	font: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const reactionPillSelected = style({
	backgroundColor: vars.palette.primary_100,
});

export const reactionCount = style({
	paddingLeft: space.xs,
});
