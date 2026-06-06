import { createVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius } from '#/styles/tokens.css';

/** Inner-box aspect ratio (the gif ratio clamped to a 1:2 minimum). */
export const ratioVar = createVar();
/** `paddingTop` percentage driving the bounding-box height. */
export const padVar = createVar();

export const outer = style({ width: '100%' });

export const sizer = style({
	overflow: 'hidden',
	paddingTop: padVar,
	position: 'relative',
});

export const abs = style({
	bottom: 0,
	display: 'flex',
	flexDirection: 'row',
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
});

export const box = style({
	aspectRatio: ratioVar,
	backgroundColor: '#000',
	borderRadius: `${borderRadius.md}px`,
	boxSizing: 'border-box',
	height: '100%',
	overflow: 'hidden',
	position: 'relative',
});

// RNW insets the inner layers by 2px on every edge to hide a sub-pixel clipping seam on web.
export const inset = style({
	bottom: '-2px',
	left: '-2px',
	position: 'absolute',
	right: '-2px',
	top: '-2px',
});

export const video = style({
	display: 'block',
	height: '100%',
	width: '100%',
});

export const playButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'transparent',
	border: 0,
	bottom: 0,
	cursor: 'pointer',
	display: 'flex',
	justifyContent: 'center',
	left: 0,
	margin: 0,
	padding: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 2,
});

const dimBase = style({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 1,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_0 },
	},
});

// RNW darkens a paused gif with two stacked overlays (0.2 from the controls + 0.3 outside them).
export const dimInner = style([dimBase, { opacity: 0.2 }]);
export const dimOuter = style([dimBase, { opacity: 0.3 }]);

const badge = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.75)',
	borderRadius: '6px',
	bottom: '6px',
	display: 'flex',
	justifyContent: 'center',
	paddingBlock: '3px',
	paddingInline: '4px',
	position: 'absolute',
	zIndex: 2,
});

export const gifBadge = style([badge, { left: '6px' }]);

export const altBadge = style([
	badge,
	{ appearance: 'none', border: 0, cursor: 'pointer', margin: 0, right: '6px' },
]);

export const badgeText = style({
	selectors: { '&&': { color: '#fff' } },
});
