import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

// pins the labeler row's avatar and trailing chevron to the top rather than centering them on the
// multi-line title/description column.
export const labelerRow = style({
	alignItems: 'flex-start',
});

// center the trailing chevron against the 40px avatar instead of the row's flex-start top edge.
export const labelerChevron = style({
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
