import { style } from '@vanilla-extract/css';

export const emptyContainer = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
});
