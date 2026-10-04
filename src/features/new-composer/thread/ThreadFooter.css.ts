import { globalStyle, style } from '@vanilla-extract/css';

import { body } from '#/components/Dialog/Popup.css';
import { getScrollDivider } from '#/components/Dialog/scroll-divider';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexShrink: 0,
	gap: space.md,
	justifyContent: 'space-between',
	alignItems: 'center',
	backgroundColor: colors.bg,
	padding: space.lg,
});

globalStyle(`:has(> ${root}) ${body}::after`, getScrollDivider('bottom'));

export const start = style({
	display: 'flex',
});

export const end = style({
	display: 'flex',
	gap: space.sm,
});
