import { style } from '@vanilla-extract/css';

import { HEADER_SLOT_SIZE } from '#/components/web/Layout/const';

// flex region that centers the logo between the flanking header slots
export const logo = style({
	alignItems: 'center',
	display: 'flex',
	flex: '1 1 0%',
	justifyContent: 'center',
});

// balances the right-hand feeds button so the logo stays centered past the mobile breakpoint, where the
// drawer-menu button (its mobile counterpart) is absent
export const spacer = style({
	width: HEADER_SLOT_SIZE,
});
