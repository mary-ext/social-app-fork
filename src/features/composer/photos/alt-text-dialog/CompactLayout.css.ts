import { createVar, generateIdentifier, keyframes, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

const MEDIA_TIMELINE = `--${generateIdentifier('timeline')}`;

/** What fraction of its laid-out height the image keeps once you've scrolled past it. */
export const COLLAPSED_SCALE = 0.25;

/** Negative sticky offset on how far the image rides up before pinning. */
export const offsetVar = createVar();

/** Scroll distance over which the scaling happens. */
export const rangeVar = createVar();

const collapse = keyframes({
	from: { scale: '1' },
	to: { scale: String(COLLAPSED_SCALE) },
});

export const scroller = style({
	scrollTimelineName: MEDIA_TIMELINE,
	scrollTimelineAxis: 'block',
});

export const media = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'sticky',
	top: offsetVar,
	zIndex: 1,
	alignItems: 'center',
	justifyContent: 'center',
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
	backgroundColor: vars.palette.contrast_50,
	aspectRatio: '1',
	width: '100%',
	overflow: 'hidden',
});

export const image = style({
	display: 'block',
	transformOrigin: 'bottom center',
	width: '100%',
	height: '100%',
	objectFit: 'contain',
	'@supports': {
		'(animation-timeline: scroll())': {
			animationName: collapse,
			animationTimingFunction: 'linear',
			animationFillMode: 'both',
			animationTimeline: MEDIA_TIMELINE,
			animationRange: `0 ${rangeVar}`,
		},
	},
});

export const editor = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	padding: space.lg,
	minWidth: 0,
});
