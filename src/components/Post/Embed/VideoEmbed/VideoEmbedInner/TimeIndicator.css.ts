import { style } from '@vanilla-extract/css';

export const indicator = style({
	display: 'flex',
	position: 'absolute',
	bottom: 6,
	left: 6,
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 6,
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
	paddingBlock: 3,
	paddingInline: 6,
	minHeight: 21,
	pointerEvents: 'none',
});

export const text = style({
	color: '#fff',
	fontVariant: 'tabular-nums',
});
