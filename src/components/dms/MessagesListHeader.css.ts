import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius, space } from '#/styles/tokens.css';

const PFP_SIZE = 40;

export const outerRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: space.xs,
	width: '100%',
});

export const backSlot = style({
	display: 'flex',
	alignItems: 'center',
	minHeight: PFP_SIZE,
});

export const placeholderRow = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.md,
});

export const placeholderAvatar = style({
	width: PFP_SIZE,
	height: PFP_SIZE,
	borderRadius: borderRadius.full,
	background: colors.contrast_25,
});

export const placeholderLine = style({
	width: 150,
	height: 16,
	marginTop: space.xs,
	borderRadius: borderRadius.xs,
	background: colors.contrast_25,
});

export const wrapper = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
});

export const wrapperRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: space.sm,
	width: '100%',
});

export const headingWrap = style({
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	alignItems: 'center',
	gap: space.md,
});

export const headingLink = style({
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	gap: space.md,
});

// the direct-chat header row: a transparent overlay anchor navigates to the profile, while the avatar
// (which has its own link + hover card) stacks above it. mirrors the ChatRow overlay pattern to avoid
// nesting an <a> inside an <a>.
export const headingRow = style({
	position: 'relative',
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	gap: space.md,
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

export const headingColumn = style({
	flex: 1,
	minWidth: 0,
});

export const nameRow = style({
	display: 'flex',
	flex: 1,
	minWidth: 0,
	flexDirection: 'row',
	alignItems: 'center',
});

export const nameRowSpaced = style({
	marginBottom: space._2xs,
});

export const name = style({
	flexShrink: 1,
});

export const badgePad = style({
	paddingLeft: space.xs,
});
