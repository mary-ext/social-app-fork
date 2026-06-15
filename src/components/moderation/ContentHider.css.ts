import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// shared box defaults for the wrappers: column stacking + border-box.
const viewBase = {
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
} as const;

// non-blurred wrapper — passes children straight through.
export const passthrough = style(viewBase);

// active (blurred) wrapper clips the revealed content to the card's rounded corners.
export const activeOuter = style({
	...viewBase,
	overflow: 'hidden',
});

// the revealed-content container (Collapsible.Panel).
export const panel = style(viewBase);

// the blur toggle row (Collapsible.Trigger). a bare <button> reset plus the contrast fill that lifts on
// hover/press; widens its padding past the 800px breakpoint.
export const blurButton = style({
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_25,
	border: 0,
	borderRadius: 8,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	justifyContent: 'flex-start',
	margin: 0,
	paddingBlock: 12,
	paddingInline: 16,
	textAlign: 'left',
	width: '100%',
	'@media': {
		'(min-width: 800px)': {
			gap: 12,
			paddingBlock: 16,
			paddingInline: 20,
		},
	},
	selectors: {
		// inset so the ring isn't clipped by the `overflow: hidden` active wrapper; it follows the 8px radius.
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
		'&:hover, &:active': {
			backgroundColor: vars.palette.contrast_50,
		},
	},
});

// SVG inherits the row's muted color via `currentColor` (a CSS var can't resolve in a `fill` attribute).
export const iconWrap = style({
	color: vars.palette.contrast_700,
	display: 'inline-flex',
	flexShrink: 0,
	marginLeft: -2,
});

export const labelText = style({
	flex: 1,
});

export const toggleText = style({
	marginBottom: 1,
});

export const learnMoreButton = style({
	appearance: 'none',
	alignItems: 'stretch',
	backgroundColor: 'transparent',
	border: 0,
	boxSizing: 'border-box',
	cursor: 'pointer',
	// flex (not block) so the button generates no font strut of its own — a block button's `line-height:normal`
	// at the inherited 16px inflates the text line to ~20px; the column item then drives the 17px line height.
	display: 'flex',
	flexDirection: 'column',
	margin: 0,
	paddingBottom: 0,
	paddingInline: 0,
	paddingTop: 8,
	textAlign: 'left',
	width: '100%',
	selectors: {
		// the whole blurb is the press target, but the focus ring is delegated to the `Learn more.` span below
		// rather than boxing the full sentence.
		'&:focus-visible': {
			outline: 'none',
		},
	},
});

export const learnMoreLink = style({
	borderRadius: 2,
	selectors: {
		[`${learnMoreButton}:focus-visible &`]: {
			textDecoration: 'underline',
		},
		[`${learnMoreButton}:hover &`]: {
			textDecoration: 'underline',
		},
	},
});
