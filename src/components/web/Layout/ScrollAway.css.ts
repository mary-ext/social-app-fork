import { keyframes, style } from '@vanilla-extract/css';

import { HEADER_HEIGHT } from '#/components/web/Layout/const';
import { driven, TIMELINE } from '#/components/web/Layout/scroll-away';

import { colors } from '#/styles/colors';

export const scope = style({
	timelineScope: TIMELINE,
});

export const region = style({
	viewTimelineName: TIMELINE,
	viewTimelineAxis: 'block',
	viewTimelineInset: `calc(${HEADER_HEIGHT}px + env(safe-area-inset-top, 0px)) auto`,
});

const solid = {
	borderBottomColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
} as const;

const revealed = {
	visibility: 'visible',
	translate: '0 0',
	opacity: 1,
} as const;

const solidifying = keyframes({
	from: {
		borderBottomColor: 'transparent',
		backgroundColor: 'transparent',
	},
	to: solid,
});

const revealing = keyframes({
	from: {
		visibility: 'hidden',
		translate: '0 6px',
		opacity: 0,
	},
	to: revealed,
});

export const backdrop = style([
	{
		position: 'absolute',
		inset: 0,
		zIndex: -1,
		borderBottom: '1px solid transparent',
		backgroundColor: 'transparent',
	},
	driven(solidifying, solid),
]);

export const reveal = style([
	{
		visibility: 'hidden',
		translate: '0 6px',
		opacity: 0,
	},
	driven(revealing, revealed),
]);
