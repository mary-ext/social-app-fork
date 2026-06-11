import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// the absolutely-positioned avatar paints above this in-flow row, so upstream's `box-none` (a native
// touch-propagation hack, gated `IS_IOS ? auto : box-none`) is a no-op on web and is dropped.
export const headerAlerts = style({
	paddingBottom: space.sm,
	paddingInline: space.lg,
	paddingTop: space.xs,
});
