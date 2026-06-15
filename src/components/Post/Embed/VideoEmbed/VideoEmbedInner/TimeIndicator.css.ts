import { style } from '@vanilla-extract/css';

export const indicator = style({
	alignItems: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	borderRadius: 6,
	bottom: 6,
	display: 'flex',
	justifyContent: 'center',
	left: 6,
	minHeight: 21,
	paddingBlock: 3,
	paddingInline: 6,
	pointerEvents: 'none',
	position: 'absolute',
});

export const text = style({
	color: '#fff',
	fontVariant: 'tabular-nums',
});
