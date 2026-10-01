import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { fontWeight, space } from '#/styles/tokens.css';

import { overlay, OVERLAY_SIZE } from '../overlay.css';
import { revealOnHover } from '../reveal.css';

export const badge = style({
	display: 'flex',
	alignItems: 'center',
	boxSizing: 'border-box',
	borderRadius: 999,
	height: OVERLAY_SIZE,
	fontSize: 12,
	fontWeight: fontWeight.semiBold,
	lineHeight: 1,
});

export const altChipShape = style({ gap: space.xs, padding: '0 11px 0 8px' });

export const uploadShape = style({ gap: 6, padding: '0 11px 0 5px', fontVariantNumeric: 'tabular-nums' });

export const altCheck = style({
	color: vars.palette.positive_500,
});

export const actions = style([revealOnHover, { display: 'flex', gap: 6 }]);

// #region overlay

const overlayBadge = style([
	badge,
	overlay,
	{
		position: 'absolute',
		bottom: space.sm,
		left: space.sm,
	},
]);

export const overlayAltChip = style([overlayBadge, altChipShape]);

export const overlayUploadBadge = style([overlayBadge, uploadShape]);

export const overlayActions = style([
	actions,
	{
		position: 'absolute',
		top: space.sm,
		right: space.sm,
	},
]);

// #endregion
