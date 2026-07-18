import { style } from '@vanilla-extract/css';

import { leadingOverrideVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';
import { lineHeight, space } from '#/styles/tokens.css';

export const dialogHeaderRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
});

export const dialogNameColumn = style({
	display: 'flex',
	flex: '1 1 0%',
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});

export const dialogTitle = style({
	vars: { [leadingOverrideVar]: String(lineHeight.tight) },
});

export const dialogLikedByRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
});

export const dialogActionsRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space.sm,
});

export const dialogActionButton = style({
	flex: '1 1 0%',
});

export const dialogReportSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	paddingTop: space.xs,
});

export const dialogReportRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'space-between',
});

export const dialogWrongText = style({
	fontStyle: 'italic',
});

export const infoButton = style({
	appearance: 'none',
	display: 'flex',
	flexGrow: 1,
	gap: space.sm,
	alignItems: 'center',
	outline: 'none',
	border: 'none',
	borderRadius: 8,
	background: 'none',
	padding: 0,
	minWidth: 0,
	textAlign: 'left',
	cursor: 'pointer',
});

export const infoButtonText = style({
	flexGrow: 1,
	minWidth: 0,
});

export const infoButtonMeta = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const infoButtonHandle = style({
	flexShrink: 1,
	minWidth: 0,
	textAlign: 'left',
});

export const infoButtonLikes = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: 2,
	alignItems: 'center',
});

export const infoButtonEllipsis = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transitionDuration: '100ms',
	transitionProperty: 'background-color, color, border-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	borderRadius: 999,
	width: 33,
	height: 33,

	selectors: {
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
		[`${infoButton}:focus-visible &`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const skeletonBar = style({
	borderRadius: 8,
	backgroundColor: vars.palette.contrast_25,
	width: '100%',
	height: 40,
});

export const skeletonPin = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 999,
	backgroundColor: vars.palette.contrast_25,
	width: 33,
	height: 33,
});
