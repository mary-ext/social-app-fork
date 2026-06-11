import { style } from '@vanilla-extract/css';

// the alert button sits in a row so callers can place it inline; spacing comes from the caller's `className`.
export const row = style({
	display: 'flex',
	flexDirection: 'row',
});
