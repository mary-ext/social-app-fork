import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';

import { NOTIF_AVI_SIZE, ROW_GAP, ROW_PADDING } from './NotificationFeedItem.css';

// mirrors the box model of the real item's `outer`, minus the interactive chrome. the icon column and
// content layout are shared verbatim by importing the item's own classes in the .tsx.
export const item = style({
	alignItems: 'flex-start',
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: ROW_GAP,
	paddingBlock: ROW_PADDING,
	paddingInline: ROW_PADDING,
});

export const itemTopBorder = style({ borderTopWidth: 1 });

const shimmer = style({ backgroundColor: vars.palette.contrast_50, flexShrink: 0 });

export const avatar = style([shimmer, { borderRadius: 999, height: NOTIF_AVI_SIZE, width: NOTIF_AVI_SIZE }]);

// matches the item's `notifText` top offset so the text bars sit where the real text does.
export const textBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 6,
	paddingTop: 6,
});

export const line = style([shimmer, { borderRadius: 6, height: 6 }]);
export const lineWide = style({ width: '90%' });
export const lineNarrow = style({ width: '70%' });
