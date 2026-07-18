import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const actionButton = style({
	width: '100%',
});

export const badges = style({
	marginTop: -3,
});

export const headerSection = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	width: '100%',
});

export const infoRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
});

export const inner = style({
	alignItems: 'center',
});

export const loaderBox = style({
	padding: space._2xl,
});

export const metaSection = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	marginTop: space.lg,
	width: '100%',
});

export const noLongerAvailableText = style({
	marginBottom: space._2xs,
});

export const ownerRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
	justifyContent: 'center',
	marginBottom: space.md,
});

export const personGroupIcon = style({
	marginTop: -2,
	marginRight: 4,
	marginLeft: space.md,
});

export const shrinkText = style({
	flexShrink: 1,
	minWidth: 0,
});

export const titleGroup = style({
	display: 'flex',
	flexDirection: 'column',
});

export const unavailableSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space._4xl,
	paddingBottom: space.lg,
});
