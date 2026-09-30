import { globalStyle, style } from '@vanilla-extract/css';

import { body } from '#/components/Dialog/Popup.css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

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

globalStyle(`:has(> ${scrollingBorder}) ${body}::before`, {
	display: 'block',
	position: 'sticky',
	top: 0,
	zIndex: zIndex.raised,
	transitionDuration: '150ms',
	transitionProperty: 'opacity',
	opacity: 0,
	// cancel out its height to avoid layout shifts.
	marginBottom: -1,
	backgroundColor: colors.contrast_200,
	height: 1,
	pointerEvents: 'none',
	content: '""',
	'@container': {
		'scroll-state(scrollable: top)': {
			opacity: 1,
		},
	},
});

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
