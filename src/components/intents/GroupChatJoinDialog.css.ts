import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const actionButton = style({
	width: '100%',
});

export const badges = style({
	marginTop: -3,
});

export const headerSection = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

export const infoRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
});

// Stack supplies the flex column + gap; only the centering is bespoke here.
export const inner = style({
	alignItems: 'center',
});

export const loaderBox = style({
	padding: space._2xl,
});

export const metaSection = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	marginTop: space.lg,
	width: '100%',
});

export const noLongerAvailableText = style({
	marginBottom: space._2xs,
});

export const ownerRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	justifyContent: 'center',
	marginBottom: space.md,
});

export const personGroupIcon = style({
	marginLeft: space.md,
	marginRight: 4,
	marginTop: -2,
});

// the two shrinkable texts in the owner row: each shrinks and truncates rather than overflowing the row.
export const shrinkText = style({
	flexShrink: 1,
	minWidth: 0,
});

export const titleGroup = style({
	display: 'flex',
	flexDirection: 'column',
});

export const unavailableSection = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	paddingBottom: space.lg,
	paddingTop: space._4xl,
});
