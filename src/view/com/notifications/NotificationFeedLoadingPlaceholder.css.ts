import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

import { NOTIF_AVI_SIZE } from './NotificationFeedItem.css';

export const item = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 12,
	alignItems: 'flex-start',
	borderTopWidth: 0,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	paddingBlock: 12,
	paddingInline: 16,
});

export const itemTopBorder = style({ borderTopWidth: 1 });

export const avatars = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	height: NOTIF_AVI_SIZE,
});

export const gallery = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
	alignItems: 'flex-start',
	opacity: 0.6,
	marginTop: 5,
	marginLeft: 2,
});

export const galleryTile = style({
	flexBasis: 0,
	flexGrow: 1,
	borderRadius: 4,
	backgroundColor: vars.palette.contrast_50,
	aspectRatio: '1',
	minWidth: 0,
	maxWidth: 100,
});
