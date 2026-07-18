import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const sizeVar = createVar();
const size = fallbackVar(sizeVar, '32px');

export const wrap = style({
	display: 'inline-grid',
	placeItems: 'center',
});

export const circle = style({
	gridArea: '1 / 1',
	opacity: 0.7,
	borderRadius: 9999,
	boxShadow: '0 0 32px rgba(0, 0, 0, 0.5)',
	width: `calc(${size} * 1.6667)`,
	height: `calc(${size} * 1.6667)`,
	selectors: {
		'.theme--light &': { backgroundColor: vars.palette.contrast_25 },
		'.theme--dark &, .theme--dim &': { backgroundColor: vars.palette.contrast_975 },
	},
});

export const icon = style({
	position: 'relative',
	gridArea: '1 / 1',
	zIndex: 1,
	selectors: {
		'.theme--light &': { color: vars.palette.contrast_975 },
		'.theme--dark &, .theme--dim &': { color: vars.palette.contrast_25 },
	},
});
