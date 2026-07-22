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

export const row = recipe({
	base: {
		display: 'flex',
		flexDirection: 'column',
		marginInline: space.lg,
	},
	variants: {
		firstInCluster: {
			true: { marginTop: space.md },
			false: { marginTop: CLUSTERED_MESSAGE_GAP },
		},
		hasReactions: {
			true: { paddingBottom: 26 },
		},
	},
});

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

export const relative = style({
	position: 'relative',
});

export const avatarSlot = style({
	position: 'absolute',
	bottom: 0,
	zIndex: 50,
});

export const col = recipe({
	base: {
		position: 'relative',
		flexGrow: 1,
	},
	variants: {
		avatarGutter: {
			true: { paddingLeft: AVATAR_SIZE },
		},
	},
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

export const reactionsWrap = recipe({
	base: {
		position: 'absolute',
		top: '100%',
		paddingInline: space.sm,
		zIndex: 10,
	},
	variants: {
		fromSelf: {
			true: { right: 0 },
			false: { left: 0 },
		},
		groupIndent: {
			true: { marginLeft: space.sm },
		},
	},
});

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

export const replyCaption = recipe({
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
});

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
