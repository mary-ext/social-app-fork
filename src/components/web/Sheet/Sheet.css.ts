import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const maxHeight = '80vh';

export const popup = style({
	backgroundColor: vars.palette.contrast_0,
	border: `1px solid ${vars.palette.contrast_200}`,
	borderRadius: 12,
	boxShadow: vars.shadow.dialog,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	maxHeight,
	maxWidth: 600,
	overflow: 'hidden',
	position: 'relative',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	width: '100%',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.95)' },
	},
});

// lock the popup to its max height regardless of content, so a full-height dialog (e.g. the GIF picker)
// doesn't shrink to fit a transient loading/empty/error state.
export const popupFullHeight = style({
	height: maxHeight,
});

/** Scrollable content region below the header. */
export const body = style({
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
});
