import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// the label-source band runs full-bleed to the card edges, so the Popup's own 24px padding is dropped here and
// reapplied per-section instead.
export const popup = style({
	maxWidth: 460,
	padding: 0,
});

// the `Text` primitives are inline `<span>`s, so the section restates the column stacking + border-box that the
// RN `View` it stands in for would supply (cf. `ContentHider.css.ts`).
export const main = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	paddingBlock: '20px 16px',
	paddingInline: 20,
});

export const title = style({
	marginBottom: 8,
});

export const admonition = style({
	marginTop: 12,
});

// the source attribution for a label cause: a full-bleed band pinned to the card's bottom edge, its corners
// rounded to sit inside the Popup's 12px radius (less its 1px border).
export const labelBand = style({
	backgroundColor: vars.palette.contrast_25,
	borderBottomLeftRadius: 11,
	borderBottomRightRadius: 11,
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	boxSizing: 'border-box',
	paddingBlock: 12,
	paddingInline: 20,
});

export const sourceRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 20,
	justifyContent: 'space-between',
});

export const sourceText = style({
	flex: 1,
});

export const expires = style({
	flexShrink: 0,
	fontStyle: 'italic',
});
