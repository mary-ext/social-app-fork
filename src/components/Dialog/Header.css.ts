import { globalStyle, style } from '@vanilla-extract/css';

import { body } from '#/components/Dialog/Popup.css';
import { getScrollDivider } from '#/components/Dialog/scroll-divider';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

// keep the row height independent of the border.
export const root = style({
	boxSizing: 'content-box',
	display: 'flex',
	flexShrink: 0,
	gap: space.lg,
	alignItems: 'center',
	backgroundColor: colors.bg,
	paddingInline: space.lg,
	height: 56,
});

export const border = style({
	borderBottom: `1px solid ${colors.contrast_200}`,
});

export const scrollingBorder = style({});

globalStyle(`:has(> ${scrollingBorder}) ${body}::before`, getScrollDivider('top'));

// align the icon with the dialog padding without shrinking its hit area.
export const leadingButton = style({
	margin: -space.sm,
});

export const title = style({
	flex: 1,
	minWidth: 0,
});

export const actions = style({
	display: 'flex',
	flexShrink: 0,
	gap: space.sm,
	alignItems: 'center',
});
