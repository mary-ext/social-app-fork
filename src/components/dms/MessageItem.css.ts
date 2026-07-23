import { generateIdentifier, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { borderRadius, space } from '#/styles/tokens.css';

export const AVATAR_SIZE = 28;
export const CLUSTERED_MESSAGE_GAP = 2;

const DISPLAY_NAME_INSET = space.md;

export const emojiBaselineNudge = style({ marginBottom: -space.sm });

const areas = {
	author: generateIdentifier('areas_author'),
	avatar: generateIdentifier('areas_avatar'),
	content: generateIdentifier('areas_content'),
	meta: generateIdentifier('areas_meta'),
	reactions: generateIdentifier('areas_reactions'),
};

export const row = recipe(
	{
		base: {
			position: 'relative',
			display: 'grid',
			paddingInline: space.lg,
		},
		variants: {
			avatarGutter: {
				true: {
					columnGap: space.sm,
					gridTemplateAreas: `". ${areas.author}" "${areas.avatar} ${areas.content}" ". ${areas.reactions}" "${areas.meta} ${areas.meta}"`,
					gridTemplateColumns: `[${areas.avatar}] ${AVATAR_SIZE}px [${areas.content}] minmax(0, 1fr)`,
				},
				false: {
					gridTemplateAreas: `"${areas.author}" "${areas.content}" "${areas.reactions}" "${areas.meta}"`,
					gridTemplateColumns: `[${areas.content}] minmax(0, 1fr)`,
				},
			},
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
	zIndex: -1,
	top: -CLUSTERED_MESSAGE_GAP,
	bottom: -CLUSTERED_MESSAGE_GAP,
	left: 0,
	right: 0,
	background: colors.primary_100,
	opacity: 0,
	pointerEvents: 'none',
});

export const avatar = style({
	gridArea: areas.avatar,
	alignSelf: 'end',
});

export const bubbleRow = recipe(
	{
		base: {
			gridArea: areas.content,
			display: 'flex',
			alignItems: 'center',
			columnGap: space.xs,
		},
		variants: {
			fromSelf: {
				true: { flexDirection: 'row-reverse' },
				false: { flexDirection: 'row' },
			},
		},
	},
	{ debugId: 'messageItemBubbleRow' },
);

export const bubble = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			minWidth: 0,
			maxWidth: '80%',
		},
		variants: {
			fromSelf: {
				true: { alignItems: 'flex-end' },
				false: { alignItems: 'flex-start' },
			},
		},
	},
	{ debugId: 'messageItemBubble' },
);

export const actions = recipe(
	{
		base: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			transition: 'opacity 150ms ease',
			opacity: 0,
			selectors: {
				'&:has([data-popup-open], :focus-visible)': {
					transition: 'none',
					opacity: 1,
				},
				'div:hover > &': {
					opacity: 1,
				},
			},
		},
		variants: {
			fromSelf: {
				true: { flexDirection: 'row-reverse' },
				false: { flexDirection: 'row' },
			},
		},
	},
	{ debugId: 'messageItemActions' },
);

export const displayName = style({
	gridArea: areas.author,
	paddingTop: space.xs,
	paddingBottom: space._2xs,
	paddingLeft: DISPLAY_NAME_INSET,
});

export const bubbleStyled = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	maxWidth: '100%',
	paddingBlock: space.sm,
	paddingInline: space.md,
});

/**
 * rounds a message bubble, squaring off the corners on the side it's anchored to (right for self, left for
 * others) when it clusters against a neighbor. shared by the text bubble, its embeds, and the blocked
 * placeholder so they round in lockstep.
 */
export const bubbleCorners = recipe(
	{
		base: { borderRadius: borderRadius.xl },
		variants: {
			fromSelf: { false: {}, true: {} },
			squaredBottom: { false: {}, true: {} },
			squaredTop: { false: {}, true: {} },
		},
		compoundVariants: [
			{ fromSelf: false, squaredBottom: true, style: { borderBottomLeftRadius: borderRadius.xs } },
			{ fromSelf: false, squaredTop: true, style: { borderTopLeftRadius: borderRadius.xs } },
			{ fromSelf: true, squaredBottom: true, style: { borderBottomRightRadius: borderRadius.xs } },
			{ fromSelf: true, squaredTop: true, style: { borderTopRightRadius: borderRadius.xs } },
		],
	},
	{ debugId: 'messageItemBubbleCorners' },
);

export const reactionsWrap = recipe(
	{
		base: {
			gridArea: areas.reactions,
			display: 'flex',
			marginTop: -6,
			paddingInline: space.sm,
		},
		variants: {
			fromSelf: {
				true: { justifyContent: 'flex-end' },
				false: { justifyContent: 'flex-start' },
			},
		},
	},
	{ debugId: 'messageItemReactions' },
);

export const meta = style({
	gridArea: areas.meta,
	marginBlock: space._2xs,
});

export const blockedButton = style({
	gridArea: areas.content,
	justifySelf: 'start',
	appearance: 'none',
	maxWidth: '80%',
	padding: 0,
	border: 'none',
	background: 'none',
	textAlign: 'left',
	cursor: 'pointer',
});

export const blockedBubble = style({
	alignSelf: 'flex-start',
	flexShrink: 1,
	paddingBlock: space.sm,
	paddingInline: space.md,
	border: `1px solid ${colors.borderContrastHigh}`,
	background: colors.bg,
});

export const replyCaption = recipe(
	{
		base: {
			gridArea: areas.author,
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
