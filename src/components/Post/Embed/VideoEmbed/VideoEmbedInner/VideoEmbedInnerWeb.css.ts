import { style } from '@vanilla-extract/css';

export const root = style({
	display: 'flex',
	position: 'relative',
	flex: 1,
	overflow: 'hidden',
});

// a filter hint blocks hardware underlays, avoiding buffer reallocation stalls when scrolling
// on Android Chromium. allow overlays in fullscreen, where the page doesn't scroll.
export const noOverlay = style({
	willChange: 'filter',
	selectors: {
		':fullscreen &': {
			willChange: 'auto',
		},
	},
});

export const srOnly = style({
	position: 'absolute',
	transform: 'scale(0)',
});
