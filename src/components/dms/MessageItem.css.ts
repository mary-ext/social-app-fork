import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const emojiBaselineNudge = style({ marginBottom: -space.sm });

export const reactionPill = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_25,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.lg,
	boxShadow: vars.shadow.xs,
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
	paddingBlock: 7,
	paddingInline: space.sm,
	transform: 'translateY(-6px)',
});

export const reactionPillButton = style({
	cursor: 'pointer',
	font: 'inherit',
	margin: 0,
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
