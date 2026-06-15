import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// the avatar and trailing chevron pin to the top of the row rather than centering on the multi-line
// title/description column. align-self overrides the row's `align-items: center` for just that child,
// which is order-independent — unlike a container-level override, which loses to the row's rowPlain
// class being re-emitted (duplicated into every consuming chunk) from a later-loading screen chunk.
export const labelerAvatar = style({
	alignSelf: 'flex-start',
});

// the trailing chevron pins to the top like the avatar, then nudges down to center against it (the
// avatar is 40px, the chevron 16px).
export const labelerChevron = style({
	alignSelf: 'flex-start',
	marginTop: (40 - 16) / 2,
});

// a labeler row's stacked title + description column, taking the row's free space beside the avatar.
export const identity = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});

// the "required in your region" line beneath a non-configurable labeler: a muted flag + italic note.
export const regionalNotice = style({
	alignItems: 'center',
	color: vars.palette.contrast_500,
	display: 'flex',
	fontStyle: 'italic',
	gap: space.xs,
	paddingTop: space._2xs,
});

// the unavailable-services notice: the admonition stretched full width above its left-aligned action.
export const cleanup = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const removeButton = style({
	alignSelf: 'flex-start',
});

// a centered slot for the labelers spinner / error while the list resolves.
export const status = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xl,
});
