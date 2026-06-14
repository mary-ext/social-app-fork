import { style } from '@vanilla-extract/css';

import { leadingOverrideVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';
import { lineHeight } from '#/styles/tokens.css';

// the `Text`/`Admonition`/input children are inline or self-contained, so the body restates the column
// stacking the RN `ScrollableInner` View it stands in for would supply. the Popup keeps its own 24px padding.
export const main = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
});

// pins the `_2xl` heading's leading tight (the default paired ratio is body-tuned and runs loose here).
export const title = style({
	marginBottom: 4,
	vars: { [leadingOverrideVar]: String(lineHeight.tight) },
});

// the label list: bordered cards stacked under the heading, separated by 12px.
export const list = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
	paddingBlock: 16,
});

// a single label: a bordered, rounded card with a top info section and a bottom source band.
export const card = style({
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 8,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
});

export const cardTop = style({
	// top-align so the appeal button keeps its natural height instead of stretching to the text column.
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	padding: 12,
});

// the name/description column; min-width:0 lets the clamped description ellipsize beside the appeal button.
export const cardInfo = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 4,
	minWidth: 0,
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const band = style({
	backgroundColor: vars.palette.contrast_25,
	boxSizing: 'border-box',
	paddingBlock: 8,
	paddingInline: 12,
});

export const sourceRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 20,
	justifyContent: 'space-between',
	paddingBottom: 1,
});

export const sourceText = style({
	flex: 1,
	minWidth: 0,
});

export const expires = style({
	flexShrink: 0,
	fontStyle: 'italic',
});

// the title + "this appeal will be sent to…" subtitle, stacked (they're inline `Text` spans on their own).
export const appealHeader = style({
	display: 'flex',
	flexDirection: 'column',
});

export const appealError = style({
	marginTop: 8,
});

export const appealInput = style({
	marginBlock: 12,
});

// Back/Submit row: stacked (reversed, so Submit sits on top) on narrow viewports; split across the row past
// the 800px breakpoint.
export const appealActions = style({
	display: 'flex',
	flexDirection: 'column-reverse',
	gap: 8,
	'@media': {
		'(min-width: 800px)': {
			flexDirection: 'row',
			gap: 0,
			justifyContent: 'space-between',
		},
	},
});
