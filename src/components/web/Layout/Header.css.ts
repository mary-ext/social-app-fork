import { createVar, style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import {
	BUTTON_VISUAL_ALIGNMENT_OFFSET,
	CENTER_COLUMN_OFFSET,
	CENTER_COLUMN_WIDTH,
	HEADER_SLOT_SIZE,
	SCROLLBAR_OFFSET,
} from '#/components/web/Layout/const';

import { vars } from '#/styles/contract.css';
import { roundToDevicePx } from '#/styles/round';
import { fontSize, lineHeight } from '#/styles/tokens.css';

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
 * Header title: bumps from `lg` to `xl` past the mobile breakpoint. Overriding the font size detaches it from
 * the `Text` recipe's `size` variant, which is what pairs the line-height to the font, so the matching
 * `tight` line-height is recomputed here — otherwise the title keeps the default `sm` line-height and the
 * `numberOfLines` clamp crops it.
 */
export const title = style({
	fontSize: fontSize.lg,
	lineHeight: roundToDevicePx(calc.multiply(fontSize.lg, lineHeight.tight)),
	'@media': {
		'screen and (min-width: 800px)': {
			fontSize: fontSize.xl,
			lineHeight: roundToDevicePx(calc.multiply(fontSize.xl, lineHeight.tight)),
		},
	},
});
