import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

import { NOTIF_AVI_SIZE } from './NotificationFeedItem.css';

// mirrors the box model of the real item's `outer`, minus the interactive chrome (cursor, hover, overflow).
// the icon column and content layout are shared verbatim by importing the item's own classes in the .tsx.
export const item = style({
	alignItems: 'flex-start',
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	paddingBlock: 12,
	paddingInline: 16,
});

export const itemTopBorder = style({ borderTopWidth: 1 });

// the row of author avatars: like the real single-author `avatarsRow` and the multi-author trigger, a row
// of 32px circles spaced 8px apart (minus the trigger's cursor/chevron, which a placeholder doesn't need).
export const avatars = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	height: NOTIF_AVI_SIZE,
});

// mirrors MediaPreview's inline image strip — a flex row of square tiles (`gap_xs`, `rounded_xs`,
// `aspect_square`, each flex-grown but capped at 100px) — so a gallery placeholder lands where a liked
// post's media would. the `marginTop` matches the real embed's offset from the subject text, and the
// `opacity` dims the strip to the same tone as the blended subject-text bar so it doesn't draw the eye.
export const gallery = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	marginLeft: 2,
	marginTop: 5,
	opacity: 0.6,
});

export const galleryTile = style({
	aspectRatio: '1',
	backgroundColor: vars.palette.contrast_50,
	borderRadius: 4,
	flexBasis: 0,
	flexGrow: 1,
	maxWidth: 100,
	minWidth: 0,
});
