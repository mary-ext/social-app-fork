import { style } from '@vanilla-extract/css';

// the form dialog is a touch narrower than the default Popup. unlayered, so it wins over the Popup's
// `components`-layered `size` maxWidth with no specificity hack.
export const popup = style({
	maxWidth: 420,
});

// the `Text`/`Admonition`/field children are inline or self-contained, so restate the column stacking the RN
// `ScrollableInner` View it stands in for would supply. the Popup keeps its own 24px padding.
export const container = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 20,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
});

// Cancel + Go Live, reversed so the primary CTA sits on the right.
export const actions = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row-reverse',
	gap: 12,
});

// gap before the muted time hint, in both the trigger value and the dropdown options. the literal spaces in
// the markup collapse under the web Text's `white-space: normal`, so restate the gap as a margin here.
export const timeGap = style({
	marginLeft: 4,
});
