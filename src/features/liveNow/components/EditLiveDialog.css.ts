import { style } from '@vanilla-extract/css';

// the form dialog is a touch narrower than the default Popup. unlayered, so it wins over the Popup's
// `components`-layered `size` maxWidth with no specificity hack.
export const popup = style({
	maxWidth: 420,
});

// restate the column stacking the RN `ScrollableInner` View it stands in for would supply. the Popup keeps
// its own 24px padding.
export const container = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

// clock icon + expiry text.
export const expiryRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: 4,
});

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

// Remove + Save/Close, reversed so the primary CTA sits on the right.
export const actions = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row-reverse',
	gap: 12,
});
