import { style } from '@vanilla-extract/css';

// the appeal form is a touch narrower than the default Popup. unlayered, so it wins over the Popup's
// `components`-layered `size` maxWidth with no specificity hack.
export const popup = style({
	maxWidth: 400,
});

// the `Text`/field children are inline or self-contained, so restate the column stacking the RN
// `ScrollableInner` View it stands in for would supply. the Popup keeps its own 24px padding.
export const container = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
});

// keep the wrapping title clear of the Popup's top-right close button.
export const title = style({
	paddingRight: 32,
});

export const fields = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
});
