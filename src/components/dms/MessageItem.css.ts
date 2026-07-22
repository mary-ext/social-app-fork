import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

const AVATAR_SIZE = 28;
const CLUSTERED_MESSAGE_GAP = 2;
const DISPLAY_NAME_INSET = 22;
// the row's horizontal margin, negated so the highlight flash bleeds to the screen edges.
const FLASH_BLEED = -space.lg;

export const emojiBaselineNudge = style({ marginBottom: -space.sm });

export const row = recipe(
	{
		base: {
			position: 'relative',
			display: 'flex',
			flexDirection: 'column',
			marginInline: space.lg,
		},
		variants: {
			firstInCluster: {
				true: { marginTop: space.md },
				false: { marginTop: CLUSTERED_MESSAGE_GAP },
			},
		},
	},
	{ debugId: 'messageItemRow' },
);

export const flash = style({
	position: 'absolute',
	top: -CLUSTERED_MESSAGE_GAP,
	bottom: -CLUSTERED_MESSAGE_GAP,
	left: FLASH_BLEED,
	right: FLASH_BLEED,
	background: colors.primary_100,
	opacity: 0,
	pointerEvents: 'none',
});

// the avatar + content two-column grid. the avatar column is a fixed gutter (empty for non-tail
// messages in a cluster); self and 1:1 rows collapse to a single content column. reactions occupy a
// second row under the content so they don't stretch the avatar's row past the bubble.
export const body = recipe(
	{
		base: {
			position: 'relative',
			display: 'grid',
		},
		variants: {
			avatarGutter: {
				true: { gridTemplateColumns: `[avatar] ${AVATAR_SIZE}px [content] minmax(0, 1fr)` },
				false: { gridTemplateColumns: '[content] minmax(0, 1fr)' },
			},
		},
	},
	{ debugId: 'messageItemBody' },
);

// bottom-aligned within the bubble row so a cluster's single avatar sits beside its last message.
export const avatar = style({
	gridColumn: 'avatar',
	gridRow: 1,
	alignSelf: 'end',
});

export const content = style({
	gridColumn: 'content',
	gridRow: 1,
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
});

export const displayName = style({
	paddingTop: space.xs,
	paddingBottom: space._2xs,
	paddingLeft: DISPLAY_NAME_INSET,
});

export const bubbleIndent = style({
	marginLeft: space.sm,
});

export const bubbleStyled = style({
	// a flex column (like the RN View) so a reply quote stretches to the bubble's full width.
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	maxWidth: '100%',
	paddingBlock: space.sm,
	paddingInline: space.md,
	borderRadius: borderRadius.xl,
});

export const bubbleSelf = style({
	alignSelf: 'flex-end',
});

export const bubbleOther = style({
	alignSelf: 'flex-start',
});

export const reactionsWrap = recipe(
	{
		base: {
			gridColumn: 'content',
			gridRow: 2,
			display: 'flex',
			// pull the pill up so it overlaps the bubble's bottom edge, matching the floating look.
			marginTop: -6,
			paddingInline: space.sm,
		},
		variants: {
			fromSelf: {
				true: { justifyContent: 'flex-end' },
				false: { justifyContent: 'flex-start' },
			},
			groupIndent: {
				true: { marginLeft: space.sm },
			},
		},
	},
	{ debugId: 'messageItemReactions' },
);

export const meta = style({
	marginBlock: space._2xs,
});

export const blockedButton = style({
	appearance: 'none',
	maxWidth: '80%',
	alignSelf: 'flex-start',
	padding: 0,
	border: 'none',
	background: 'none',
	textAlign: 'left',
	cursor: 'pointer',
});

export const blockedBubble = style({
	alignSelf: 'flex-start',
	flexShrink: 1,
	marginLeft: space.sm,
	paddingBlock: space.sm,
	paddingInline: space.md,
	border: `1px solid ${colors.borderContrastHigh}`,
	borderRadius: borderRadius.xl,
	background: colors.bg,
});

export const replyCaption = recipe(
	{
		base: {
			appearance: 'none',
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center',
			gap: space._2xs,
			width: '100%',
			paddingTop: space.xs,
			paddingBottom: space._2xs,
			border: 'none',
			background: 'none',
			cursor: 'pointer',
			selectors: {
				'&:disabled': { cursor: 'default' },
			},
		},
		variants: {
			align: {
				self: { justifyContent: 'flex-end', paddingRight: space.md },
				otherGroup: { justifyContent: 'flex-start', paddingLeft: DISPLAY_NAME_INSET },
				otherPlain: { justifyContent: 'flex-start', paddingLeft: space.md },
			},
		},
	},
	{ debugId: 'messageItemReplyCaption' },
);

export const replyCaptionText = style({
	flexShrink: 1,
});

export const replyQuote = style({
	appearance: 'none',
	// stretched to the bubble width by its flex-column parent; border-box keeps padding + border inside.
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	marginBottom: space.xs,
	marginInline: -4,
	padding: space.sm,
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.md,
	background: 'none',
	textAlign: 'left',
	cursor: 'pointer',
	selectors: {
		'&:disabled': { cursor: 'default' },
	},
});

export const italic = style({
	fontStyle: 'italic',
});

export const reactionPill = style({
	appearance: 'none',
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
	alignItems: 'center',
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
