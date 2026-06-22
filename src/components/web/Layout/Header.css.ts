import { style } from '@vanilla-extract/css';

import { fontSizeVar, leadingOverrideVar } from '#/components/Text.css';
import {
	BUTTON_VISUAL_ALIGNMENT_OFFSET,
	CENTER_COLUMN_WIDTH,
	HEADER_SLOT_SIZE,
} from '#/components/web/Layout/const';

import { vars } from '#/styles/contract.css';
import { fontSize, lineHeight, zIndex } from '#/styles/tokens.css';

export const outer = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_0,
	borderBottom: `1px solid ${vars.palette.contrast_100}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	marginInline: 'auto',
	maxWidth: CENTER_COLUMN_WIDTH,
	minHeight: 52,
	paddingBottom: 4,
	paddingInline: 16,
	paddingTop: 4,
	position: 'sticky',
	top: 0,
	width: '100%',
	zIndex: zIndex.sticky,
	'@media': {
		'screen and (min-width: 800px)': {
			paddingInline: 20,
		},
	},
});

export const outerNoBorder = style({
	borderBottom: 'none',
});

export const outerStatic = style({
	position: 'static',
});

export const content = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	justifyContent: 'center',
	minHeight: HEADER_SLOT_SIZE,
});

export const slot = style({
	flexShrink: 0,
	width: HEADER_SLOT_SIZE,
	zIndex: zIndex.stickyRaised,
});

// shared left-edge offset for the header's leading icon button (back / menu), nudging it to optical alignment.
export const edgeButton = style({
	marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET,
});

/**
 * Header title: bumps from `lg` to `xl` past the mobile breakpoint. Drives the `Text` recipe's `fontSizeVar`
 * (unlayered, so it beats the layered `size` variant) instead of overriding `font-size` directly, and pins
 * the leading ratio tight via `leadingOverrideVar` — the recipe re-derives the pixel-snapped line-height from
 * both, so a heading stays compact (the default paired ratio is tuned for body text and runs loose here)
 * while font-size and line-height stay paired across the breakpoint.
 */
export const title = style({
	vars: { [fontSizeVar]: fontSize.lg, [leadingOverrideVar]: String(lineHeight.tight) },
	'@media': {
		'screen and (min-width: 800px)': { vars: { [fontSizeVar]: fontSize.xl } },
	},
});
