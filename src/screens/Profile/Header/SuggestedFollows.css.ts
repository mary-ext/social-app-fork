import { style } from '@vanilla-extract/css';

// Base UI tracks the measured content height in `--collapsible-panel-height` (kept current via a ResizeObserver,
// so async-loaded suggestions still animate). We transition height between that and the collapsed 0 the
// starting/ending data-attrs mark; `overflow: hidden` clips the content during the sweep.
export const panel = style({
	boxSizing: 'border-box',
	height: 'var(--collapsible-panel-height)',
	overflow: 'hidden',
	transitionDuration: '300ms',
	transitionProperty: 'height',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': {
			height: 0,
		},
	},
});
