import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// an other-account row: the relative container hosting the full-bleed primary switch button and the
// absolutely-positioned overflow menu button as siblings (never nested interactive controls).
export const accountRow = style({
	position: 'relative',
});

// the current account's stacked name + handle column, taking the row's free space beside the avatar.
export const identity = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const displayName = style({
	minWidth: 0,
});

// the current account's name line: display name beside its profile badges.
export const nameLine = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
	minWidth: 0,
});

// the collapsed switcher's avatar peek: negative block margin keeps the 24px avatars from growing the
// trigger row past the height of its sibling rows.
export const avatarStack = style({
	display: 'flex',
	marginBlock: -2,
});

// an other-account avatar: negative block margin keeps the 28px avatar from growing the single-line row
// past the height of its sibling rows.
export const accountAvatar = style({
	alignItems: 'center',
	display: 'flex',
	flexShrink: 0,
	marginBlock: -4,
});

// the handle takes the row's free space; the end padding keeps a long handle clear of the overflow button.
export const handle = style({
	flex: 1,
	minWidth: 0,
	paddingInlineEnd: space._4xl,
});

export const avatarPlaceholder = style({
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 999,
	flexShrink: 0,
	height: 28,
	width: 28,
});

export const overflow = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 'none',
	borderRadius: 999,
	color: vars.palette.contrast_500,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xs,
	position: 'absolute',
	// aligns the dots' center with the trailing chevron icons on the other rows (24px from the card edge).
	right: space.md,
	top: '50%',
	transform: 'translateY(-50%)',
	selectors: {
		'&:hover': { background: vars.palette.contrast_100 },
	},
});
