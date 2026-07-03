import { keyframes, style } from '@vanilla-extract/css';

// the lightbox is a fixed, exclusive overlay; it shares the z-layer of the other web dialogs (10) so a
// Menu opened from inside it (web Menu positioner = 11) still stacks above.
const Z = 10;

const fadeIn = keyframes({
	from: { opacity: 0 },
	to: { opacity: 1 },
});

// #region shell
/**
 * The modal backdrop: carries only the open/close fade; the engine's swipe-dismiss fade rides the nested
 * Scrim.
 */
export const backdrop = style({
	position: 'fixed',
	inset: 0,
	zIndex: Z,
	opacity: 1,
	transition: 'opacity 200ms ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0 },
	},
});

/** Recolour the lib Scrim's `--lightbox-backdrop`; the Scrim itself fills the backdrop. */
export const scrim = style({
	vars: { '--lightbox-backdrop': 'rgba(0, 0, 0, 0.92)' },
});

/**
 * Fullscreen gesture/chrome surface; subtle scale+fade on open (the lib measures via clientWidth, which
 * ignores transforms, so the scale can't corrupt paging).
 */
export const popup = style({
	position: 'fixed',
	inset: 0,
	zIndex: Z,
	outline: 'none',
	transition: 'opacity 200ms ease, transform 200ms ease',
	selectors: {
		'&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.96)' },
	},
});

/** Positioned ancestor so the absolutely-placed chrome anchors here. */
export const viewport = style({
	position: 'relative',
	cursor: 'default',
});
// #endregion

// #region chrome
/**
 * full-bleed container holding all chrome elements for unified fade animations. transparent to pointer events
 * so taps fall through to the viewport, while interactive controls opt back in.
 */
export const chrome = style({
	position: 'absolute',
	inset: 0,
	zIndex: 1,
	pointerEvents: 'none',
	// `visibility` is transitioned too so it's held `visible` through the opacity fade-out and only flips to
	// `hidden` once it ends (and back to `visible` instantly on fade-in) — without it the discrete flip lands
	// at the start and cuts the fade.
	transition: 'opacity 200ms ease, visibility 200ms ease',
});

/** Tap-toggled hidden state for {@link chrome}; `visibility` also drops the controls out of the tab order. */
export const chromeHidden = style({
	opacity: 0,
	visibility: 'hidden',
});

const blurred = {
	backdropFilter: 'blur(8px)',
	WebkitBackdropFilter: 'blur(8px)',
} as const;

/** A round, blurred-glass icon button (menu + close). */
export const circle = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 32,
	height: 32,
	padding: 0,
	border: 'none',
	borderRadius: 16,
	color: '#fff',
	background: 'rgba(0, 0, 0, 0.75)',
	cursor: 'pointer',
	pointerEvents: 'auto',
	animation: `${fadeIn} 200ms ease 200ms both`,
	...blurred,
	selectors: {
		'&:hover': { background: 'rgba(0, 0, 0, 0.85)' },
	},
});

export const topLeft = style({ position: 'absolute', top: 20, left: 20, zIndex: 1 });
export const topRight = style({ position: 'absolute', top: 20, right: 20, zIndex: 1 });

/** Rotates the options-trigger ellipsis icon 90° to vertical. */
export const rotated = style({ transform: 'rotate(90deg)' });

/** Side paging button: larger blurred-glass round button, shrinks on narrow viewports. */
export const navButton = style({
	position: 'absolute',
	top: '50%',
	transform: 'translateY(-50%)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: 42,
	height: 42,
	padding: 0,
	border: 'none',
	borderRadius: 21,
	color: '#fff',
	background: 'rgba(0, 0, 0, 0.47)',
	cursor: 'pointer',
	pointerEvents: 'auto',
	zIndex: 1,
	animation: `${fadeIn} 200ms ease 200ms both`,
	backdropFilter: 'blur(10px)',
	WebkitBackdropFilter: 'blur(10px)',
	selectors: {
		'&:hover': { background: 'rgba(0, 0, 0, 0.53)' },
	},
	'@media': {
		'screen and (max-width: 800px)': { width: 34, height: 34 },
	},
});
export const navLeft = style({ left: 20 });
export const navRight = style({ right: 20 });
// #endregion

// #region alt + pager
export const altPanel = style({
	position: 'absolute',
	left: 0,
	right: 0,
	bottom: 0,
	zIndex: 1,
	background: 'rgba(0, 0, 0, 0.45)',
	animation: `${fadeIn} 200ms ease 200ms both`,
});

export const altButton = style({
	display: 'block',
	width: '100%',
	margin: 0,
	padding: '16px 32px',
	border: 'none',
	background: 'transparent',
	textAlign: 'left',
	cursor: 'pointer',
	pointerEvents: 'auto',
});

/** Force the alt text white + readable leading over the themed default. */
export const altText = style({
	color: '#fff',
	lineHeight: 1.4,
});

export const pagerDots = style({
	position: 'absolute',
	top: 20,
	left: 0,
	right: 0,
	zIndex: 1,
	display: 'flex',
	gap: 5,
	alignItems: 'center',
	justifyContent: 'center',
	pointerEvents: 'none',
	animation: `${fadeIn} 200ms ease 200ms both`,
});

const dotBase = {
	borderRadius: 999,
} as const;
export const dotPill = style({
	display: 'flex',
	gap: 5,
	alignItems: 'center',
	padding: '6px 10px',
	borderRadius: 999,
	background: 'rgba(0, 0, 0, 0.75)',
	...blurred,
});
export const dotActive = style({ ...dotBase, width: 6, height: 6, background: '#fff' });
export const dotInactive = style({ ...dotBase, width: 4, height: 4, background: 'rgba(255, 255, 255, 0.4)' });
// #endregion

// #region loading spinner
/** Centred, non-interactive overlay covering a slide while its full-size image is still loading. */
export const slideSpinner = style({
	position: 'absolute',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	pointerEvents: 'none',
});
// #endregion

export const srOnly = style({
	position: 'absolute',
	width: 1,
	height: 1,
	margin: -1,
	padding: 0,
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	whiteSpace: 'nowrap',
	border: 0,
});
