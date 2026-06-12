import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// placeholder shown while the quoted post resolves.
export const skeleton = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 12,
	height: 68,
	width: '100%',
});
