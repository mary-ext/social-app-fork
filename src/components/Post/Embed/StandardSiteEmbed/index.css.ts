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
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	width: '100%',
	textDecoration: 'none',
	color: 'inherit',
	cursor: 'pointer',
	selectors: {
		'&:hover': { backgroundColor: colors.contrast_25 },
		'&:focus-visible': { outline: 'none' },
	},
});

export const card = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.lg,
	borderColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	width: '100%',
	overflow: 'hidden',
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
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	selectors: {
		[`${bodyLink}:hover &`]: { borderTopColor: colors.borderContrastHigh },
	},
});

export const textBlock = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 4,
	paddingRight: space.md,
	paddingBottom: space.sm,
	paddingLeft: space.md,
});

export const metaInline = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'center',
	paddingTop: 2,
});

export const readingTime = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
	alignItems: 'center',
	color: colors.textContrastMedium,
});

export const metaSection = style({ paddingRight: space.md, paddingLeft: space.md });

export const divider = style({
	borderTopWidth: 1,
	borderTopStyle: 'solid',
	borderTopColor: colors.borderContrastLow,
	width: '100%',
});

export const metaRowPad = style({ paddingTop: space.sm, paddingBottom: space.sm });

export const metaRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
});

export const metaItem = style({
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	gap: space._2xs,
	alignItems: 'center',
	minWidth: 0,
	color: colors.textContrastMedium,
});

export const identityText = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minWidth: 0,
});

export const accentVar = createVar();
export const accentForegroundVar = createVar();

export const iconRoot = style({ position: 'relative' });

export const standardBadge = style([
	mediaBorder,
	{
		display: 'flex',
		position: 'absolute',
		top: -6,
		left: -6,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
		borderRadius: 999,
		backgroundColor: colors.bg,
		width: 16,
		height: 16,
		color: colors.textContrastMedium,
	},
]);

export const avatarWrap = style({ position: 'relative', lineHeight: 0 });

export const publicationAvatar = style({ borderRadius: borderRadius.sm });

export const avatarBorder = style([mediaOverlay, mediaBorderOpaque, { borderRadius: borderRadius.sm }]);

export const letterBox = style([
	mediaBorderOpaque,
	{
		display: 'flex',
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: borderRadius.sm,
		backgroundColor: accentVar,
	},
]);

export const letterBoxSm = style({ width: 32, height: 32 });
export const letterBoxLg = style({ width: 40, height: 40 });

export const letterText = style({ color: accentForegroundVar });

export const subscribe = style({
	position: 'relative',
	flexShrink: 0,
	gap: space.sm,
	zIndex: 1,
	width: '100%',
	pointerEvents: 'auto',
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
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: space.md,
	selectors: {
		[`${bodyLink}:hover ~ &`]: { backgroundColor: colors.contrast_25 },
	},
	'@media': {
		[gtPhone]: { flexDirection: 'row', gap: space.sm },
	},
});

export const footerFill = style({
	position: 'absolute',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	zIndex: 0,
});

export const footerIdentity = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	zIndex: 1,
	width: '100%',
	minWidth: 0,
	pointerEvents: 'none',
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
	boxSizing: 'border-box',
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: borderRadius.lg,
	borderColor: colors.borderContrastLow,
	backgroundColor: colors.bg,
	padding: space.md,
	width: '100%',
	overflow: 'hidden',
	selectors: {
		'&:hover': { borderColor: colors.borderContrastHigh, backgroundColor: colors.contrast_25 },
	},
});

export const pubFill = style([
	insetFocusRing,
	{
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		zIndex: 0,
	},
]);

export const pubTopRow = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	gap: space.md,
	alignItems: 'center',
	justifyContent: 'space-between',
	zIndex: 1,
	pointerEvents: 'none',
	'@media': {
		[gtPhone]: { flexDirection: 'row', gap: space.sm },
	},
});

export const pubIdentity = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	width: '100%',
	minWidth: 0,
	'@media': {
		[gtPhone]: { flex: 1 },
	},
});

export const pubDescription = style({
	position: 'relative',
	zIndex: 1,
	marginTop: space.sm,
	pointerEvents: 'none',
});

export const pubSubscribeStacked = style({
	position: 'relative',
	zIndex: 1,
	marginTop: space.sm,
});
