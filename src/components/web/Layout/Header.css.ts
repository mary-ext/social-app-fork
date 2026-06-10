import { createVar, style } from '@vanilla-extract/css';

import {
	BUTTON_VISUAL_ALIGNMENT_OFFSET,
	CENTER_COLUMN_OFFSET,
	CENTER_COLUMN_WIDTH,
	HEADER_SLOT_SIZE,
	SCROLLBAR_OFFSET,
} from '#/components/web/Layout/const';
import { fontSizeVar } from '#/components/web/Text.css';

import { vars } from '#/styles/contract.css';
import { fontSize } from '#/styles/tokens.css';

const offsetVar = createVar();

const scrollbarShift = `translateX(${SCROLLBAR_OFFSET})`;

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
	transform: `translateX(${offsetVar}) ${scrollbarShift}`,
	vars: { [offsetVar]: '0px' },
	width: '100%',
	zIndex: 10,
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

export const outerOffset = style({
	vars: { [offsetVar]: `${CENTER_COLUMN_OFFSET}px` },
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
	zIndex: 50,
});

export const backButton = style({
	marginLeft: -BUTTON_VISUAL_ALIGNMENT_OFFSET,
});

/**
 * Header title: bumps from `lg` to `xl` past the mobile breakpoint. Drives the `Text` recipe's `fontSizeVar`
 * (unlayered, so it beats the layered `size` variant) instead of overriding `font-size` directly — the recipe
 * then re-derives the device-snapped line-height from the title's `tight` leading, keeping the two paired.
 */
export const title = style({
	vars: { [fontSizeVar]: fontSize.lg },
	'@media': {
		'screen and (min-width: 800px)': { vars: { [fontSizeVar]: fontSize.xl } },
	},
});
