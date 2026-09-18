import { keyframes, style } from '@vanilla-extract/css';

import { BODY_TIMELINE } from '#/components/Dialog/Popup.css';

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

const divide = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
});

// overlay the divider to avoid layout shifts. browsers without scroll timelines leave it hidden.
export const scrollingBorder = style({
	position: 'relative',
	zIndex: zIndex.raised,
	'::after': {
		position: 'absolute',
		top: '100%',
		right: 0,
		left: 0,
		opacity: 0,
		backgroundColor: colors.contrast_200,
		height: 1,
		pointerEvents: 'none',
		content: '""',
	},
	'@supports': {
		'(animation-timeline: scroll())': {
			selectors: {
				'&::after': {
					animationName: divide,
					animationTimingFunction: 'linear',
					animationFillMode: 'both',
					animationTimeline: BODY_TIMELINE,
					animationRange: '0px 16px',
				},
			},
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
