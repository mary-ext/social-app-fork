import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { vars } from '#/styles/contract.css';
import { roundToDevicePx } from '#/styles/round';
import { fontSize, fontWeight, lineHeight } from '#/styles/tokens.css';

// subtle app-language switcher mirroring upstream: tighten the rectangular/tiny web Button around the value
// + chevron, and start-align the content (the Button base centers it). unlayered (like LanguageButton.css)
// so it wins over the Button recipe and the Select value/icon defaults.
export const trigger = style({
	alignSelf: 'flex-start',
	color: vars.palette.contrast_700,
	gap: 8,
	paddingLeft: 8,
	paddingRight: 4,
	textAlign: 'start',
});

// `sm`/snug value text at full text contrast and normal weight (the Typography default) — independent of
// the tiny button's own compressed, medium-weight font metrics.
export const value = style({
	color: vars.palette.contrast_1000,
	fontSize: fontSize.sm,
	fontWeight: fontWeight.normal,
	lineHeight: roundToDevicePx(calc.multiply(fontSize.sm, lineHeight.snug)),
});

// match upstream's 20px chevron line box (the Select icon is a flex span, so size it explicitly) so the
// button stands 30px tall; the chevron stays at the trigger's medium tone (only the value text is full
// contrast).
export const icon = style({
	color: vars.palette.contrast_700,
	height: 20,
});
