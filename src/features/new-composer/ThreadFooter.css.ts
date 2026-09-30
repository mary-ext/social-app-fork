import { globalStyle, style } from '@vanilla-extract/css';

import { body } from '#/components/Dialog/Popup.css';

import { colors } from '#/styles/colors';
import { space, zIndex } from '#/styles/tokens.css';

export const root = style({
	display: 'flex',
	flexShrink: 0,
	gap: space.md,
	justifyContent: 'space-between',
	alignItems: 'center',
	backgroundColor: colors.bg,
	padding: space.lg,
});

globalStyle(`:has(> ${root}) ${body}::after`, {
	display: 'block',
	position: 'sticky',
	bottom: 0,
	zIndex: zIndex.raised,
	transitionDuration: '150ms',
	transitionProperty: 'opacity',
	opacity: 0,
	// cancel out its height to avoid layout shifts.
	marginTop: -1,
	backgroundColor: colors.contrast_200,
	height: 1,
	pointerEvents: 'none',
	content: '""',
	'@container': {
		'scroll-state(scrollable: bottom)': {
			opacity: 1,
		},
	},
});

export const start = style({
	display: 'flex',
});

export const end = style({
	display: 'flex',
});
