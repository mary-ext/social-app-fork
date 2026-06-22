import { style } from '@vanilla-extract/css';

export const root = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

export const iconBox = style({
	alignItems: 'center',
	alignSelf: 'center',
	borderRadius: 999,
	display: 'flex',
	flexDirection: 'row',
	height: 64,
	justifyContent: 'center',
	marginTop: 40,
	width: 64,
});

// component icons sit slightly lower on wide viewports (the original's `gtTablet && marginTop: 50`).
export const iconBoxTablet = style({ marginTop: 50 });

export const message = style({
	alignSelf: 'center',
	paddingTop: 4,
});

export const messageNarrow = style({ maxWidth: '40%' });
export const messageWide = style({ maxWidth: '60%' });

// bottom rhythm the message owns when no button follows it.
export const messageGap = style({ marginBottom: 40 });

export const buttonWrap = style({
	alignSelf: 'center',
	display: 'flex',
	flexShrink: 1,
	marginBottom: 40,
	marginTop: 12,
});
