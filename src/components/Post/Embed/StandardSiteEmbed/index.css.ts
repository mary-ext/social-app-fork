import { createVar, style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { mediaBorder, mediaBorderOpaque, mediaOverlay } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

const insetFocusRing = style({
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
	},
});

const gtPhone = 'screen and (min-width: 500px)';

export const bodyLink = style({
	boxSizing: 'border-box',
	color: 'inherit',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	position: 'relative',
	textDecoration: 'none',
	width: '100%',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
		'&:focus-visible': { outline: 'none' },
	},
});

export const card = style({
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.lg,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	position: 'relative',
	width: '100%',
	selectors: {
		[`&:has(${bodyLink}:hover)`]: { borderColor: colors.borderContrastHigh },
		[`&:has(${bodyLink}:focus-visible)`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

export const previewLock = style({ pointerEvents: 'none' });

export const body = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 3,
	paddingTop: space.md,
});

export const bodyMedia = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	selectors: {
		[`${bodyLink}:hover &`]: { borderTopColor: colors.borderContrastHigh },
	},
});

export const textBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 4,
	paddingBottom: space.sm,
	paddingLeft: space.md,
	paddingRight: space.md,
});

export const metaInline = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	paddingTop: 2,
});

export const readingTime = style({
	alignItems: 'center',
	color: colors.textContrastMedium,
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
});

export const metaSection = style({ paddingLeft: space.md, paddingRight: space.md });

export const divider = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	width: '100%',
});

export const metaRowPad = style({ paddingBottom: space.sm, paddingTop: space.sm });

export const metaRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
});

export const metaItem = style({
	alignItems: 'center',
	color: colors.textContrastMedium,
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	gap: space._2xs,
	minWidth: 0,
});

export const identityText = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minWidth: 0,
});

export const accentVar = createVar();
export const accentForegroundVar = createVar();

export const iconRoot = style({ position: 'relative' });

export const standardBadge = style([
	mediaBorder,
	{
		alignItems: 'center',
		backgroundColor: colors.bg,
		borderRadius: 999,
		color: colors.textContrastMedium,
		display: 'flex',
		height: 16,
		justifyContent: 'center',
		left: -6,
		position: 'absolute',
		top: -6,
		width: 16,
		zIndex: 1,
	},
]);

export const avatarWrap = style({ lineHeight: 0, position: 'relative' });

export const publicationAvatar = style({ borderRadius: borderRadius.sm });

export const avatarBorder = style([mediaOverlay, mediaBorderOpaque, { borderRadius: borderRadius.sm }]);

export const letterBox = style([
	mediaBorderOpaque,
	{
		alignItems: 'center',
		backgroundColor: accentVar,
		borderRadius: borderRadius.sm,
		display: 'flex',
		justifyContent: 'center',
		position: 'relative',
	},
]);

export const letterBoxSm = style({ height: 32, width: 32 });
export const letterBoxLg = style({ height: 40, width: 40 });

export const letterText = style({ color: accentForegroundVar });

export const subscribe = style({
	flexShrink: 0,
	gap: space.sm,
	pointerEvents: 'auto',
	position: 'relative',
	width: '100%',
	zIndex: 1,
	'@media': {
		[gtPhone]: { width: 'auto' },
	},
});

export const hideOnPhone = style({
	display: 'none',
	'@media': {
		[gtPhone]: { display: 'inline-flex' },
	},
});

export const hideOnGtPhone = style({
	'@media': {
		[gtPhone]: { display: 'none' },
	},
});

export const footer = style({
	alignItems: 'center',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	justifyContent: 'space-between',
	padding: space.md,
	position: 'relative',
	'@media': {
		[gtPhone]: { flexDirection: 'row', gap: space.sm },
	},
	selectors: {
		[`${bodyLink}:hover ~ &`]: { backgroundColor: colors.contrast_25 },
	},
});

export const footerFill = style({
	bottom: 0,
	left: 0,
	position: 'absolute',
	right: 0,
	top: 0,
	zIndex: 0,
});

export const footerIdentity = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	minWidth: 0,
	pointerEvents: 'none',
	position: 'relative',
	width: '100%',
	zIndex: 1,
	'@media': {
		[gtPhone]: { flex: 1, width: 'auto' },
	},
});

export const footerTitle = style({
	selectors: {
		[`${footerFill}:hover ~ ${footerIdentity} &`]: { textDecoration: 'underline' },
	},
});

export const pubCard = style({
	backgroundColor: colors.bg,
	borderColor: colors.borderContrastLow,
	borderRadius: borderRadius.lg,
	borderStyle: 'solid',
	borderWidth: 1,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
	padding: space.md,
	position: 'relative',
	width: '100%',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25, borderColor: colors.borderContrastHigh },
	},
});

export const pubFill = style([
	insetFocusRing,
	{
		bottom: 0,
		left: 0,
		position: 'absolute',
		right: 0,
		top: 0,
		zIndex: 0,
	},
]);

export const pubTopRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	justifyContent: 'space-between',
	pointerEvents: 'none',
	position: 'relative',
	zIndex: 1,
	'@media': {
		[gtPhone]: { flexDirection: 'row', gap: space.sm },
	},
});

export const pubIdentity = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	minWidth: 0,
	width: '100%',
	'@media': {
		[gtPhone]: { flex: 1 },
	},
});

export const pubDescription = style({
	marginTop: space.sm,
	pointerEvents: 'none',
	position: 'relative',
	zIndex: 1,
});

export const pubSubscribeStacked = style({
	marginTop: space.sm,
	position: 'relative',
	zIndex: 1,
});
