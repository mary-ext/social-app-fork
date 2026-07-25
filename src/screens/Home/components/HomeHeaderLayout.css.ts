import { style } from '@vanilla-extract/css';

import { HEADER_SLOT_SIZE } from '#/components/web/Layout/const';

export const logo = style({
	display: 'flex',
	flex: '1 1 0%',
	alignItems: 'center',
	justifyContent: 'center',
});

export const spacer = style({
	width: HEADER_SLOT_SIZE,
});
