import { style } from '@vanilla-extract/css';

import { fontSizeVar, leadingOverrideVar } from '#/components/Text.css';

import { vars } from '#/styles/contract.css';
import { fontSize, lineHeight, space } from '#/styles/tokens.css';

export const dialogPopup = style({
	maxWidth: 450,
});

export const dialogBody = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
});

export const dialogHeaderRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
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
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
});

export const dialogActionsRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
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

export const dialogDivider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
});

export const dialogReportRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	justifyContent: 'space-between',
});

export const dialogWrongText = style({
	fontStyle: 'italic',
});

// the feed title/avatar/like-count, which opens the feed info dialog. a full-width pressable that tints on
// hover, matching the header's other ghost buttons.
export const infoButton = style({
	alignItems: 'center',
	appearance: 'none',
	background: 'none',
	border: 'none',
	borderRadius: 8,
	cursor: 'pointer',
	display: 'flex',
	flex: '1 1 0%',
	gap: 8,
	minWidth: 0,
	paddingBlock: 2,
	paddingLeft: 0,
	paddingRight: 8,
	transitionDuration: '100ms',
	transitionProperty: 'background-color',
	transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
	selectors: {
		'&:focus-visible': { outline: `2px solid ${vars.palette.primary_500}`, outlineOffset: 2 },
		'&:hover': { backgroundColor: vars.palette.contrast_25 },
	},
});

export const infoButtonText = style({
	flex: '1 1 0%',
	minWidth: 0,
});

export const infoButtonTitle = style({
	textAlign: 'left',
	vars: { [fontSizeVar]: fontSize.md, [leadingOverrideVar]: String(lineHeight.snug) },
	'@media': {
		'screen and (min-width: 800px)': { vars: { [fontSizeVar]: fontSize.lg } },
	},
});

export const infoButtonMeta = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 6,
});

export const infoButtonHandle = style({
	flexShrink: 1,
	minWidth: 0,
	textAlign: 'left',
});

export const infoButtonLikes = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	gap: 2,
});

export const skeletonBar = style({
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 8,
	height: 40,
	width: '100%',
});

export const skeletonPin = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_25,
	borderRadius: 999,
	display: 'flex',
	height: 34,
	justifyContent: 'center',
	width: 34,
});
