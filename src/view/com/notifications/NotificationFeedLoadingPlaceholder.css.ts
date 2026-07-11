import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

import { NOTIF_AVI_SIZE } from './NotificationFeedItem.css';

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

export const avatars = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	height: NOTIF_AVI_SIZE,
});

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
