import { createVar, style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { mediaBorder, mediaBorderOpaque, mediaOverlay } from '#/styles/media-border.css';
import { borderRadius, space } from '#/styles/tokens.css';

// inset focus ring for the card's nested link regions: an outset ring would be clipped by the card's
// `overflow: hidden`, while this rides inside the clip — which also rounds its corners to match the card.
const insetFocusRing = style({
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
	},
});

const gtPhone = 'screen and (min-width: 500px)';

// #region article card

/**
 * The whole article body (thumb + text + inline meta) is one link. Hovering it lights the entire card — its
 * own tint, the footer tint, and the card border all key off this link's hover. Hovering the footer instead
 * lights nothing and only underlines the publication name.
 */
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
		// the card paints the focus ring (via `:has`), boxing the whole card rather than just this top region;
		// suppress this link's own default outline to avoid a doubled ring.
		'&:focus-visible': { outline: 'none' },
	},
});

/** Outer card for the article/link layout: a relative, bordered box. */
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
		// ring the whole card when the article link is focused. an *outset* outline: it sits outside the border
		// (so the positioned body/footer can't paint over it), the card's own `overflow` can't clip it, and a
		// positive offset rounds its corners cleanly — unlike an inset ring, which the rounded clip cuts at the
		// corners. the post body leaves ~16px around the card, so the ancestor `GalleryBleed` clip never reaches
		// it.
		[`&:has(${bodyLink}:focus-visible)`]: {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: 2,
		},
	},
});

/** Suppresses all interaction for the composer preview, where the card is non-navigable. */
export const previewLock = style({ pointerEvents: 'none' });

export const thumb = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	display: 'block',
	objectFit: 'cover',
	width: '100%',
});

export const body = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 3,
	paddingTop: space.md,
});

/** Hairline separating the body from the thumbnail; tracks the card's hover state. */
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

/** Date + reading-time row beneath a standard-site article's description. */
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

// #endregion

// #region shared

/** Domain/author meta section shown below the article body when there's no publication footer. */
export const metaSection = style({ paddingLeft: space.md, paddingRight: space.md });

export const divider = style({
	borderTopColor: colors.borderContrastLow,
	borderTopStyle: 'solid',
	borderTopWidth: 1,
	width: '100%',
});

export const metaRowPad = style({ paddingBottom: space.sm, paddingTop: space.sm });

/** Row of `domain • by @handle` meta items. */
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

/** Per-instance accent fill for the letter fallback, wired in from the site's custom theme. */
export const accentVar = createVar();
export const accentForegroundVar = createVar();

export const iconRoot = style({ position: 'relative' });

/** Tiny standard-site badge that overlaps the publication icon's top-left corner. */
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

// unlayered, so it outranks the avatar root's layered `border-radius`, which the inner layers inherit.
export const publicationAvatar = style({ borderRadius: borderRadius.sm });

/**
 * Opaque hairline as an overlay: the publication avatar's own `filter` rules out a self-border, so the
 * rounded hairline rides on top of it instead.
 */
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

/** Subscribe / view-publication button: full width when stacked, auto when inline. */
export const subscribe = style({
	flexShrink: 0,
	// widen the icon/text gap past the Button's default 5px.
	gap: space.sm,
	// re-enable interaction inside the pointer-events-none identity rows.
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

// #endregion

// #region publication footer

/** Footer beneath an article that belongs to a standard-site publication; tints when the body is hovered. */
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

/**
 * Absolute-fill link covering the footer; navigates to the publication and underlines its name on hover. A
 * mouse-only affordance (`tabIndex -1`) — the always-present "View publication" button is the keyboard path
 * to the same destination — so it carries no focus ring of its own.
 */
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

// #endregion

// #region publication card

/** Standalone publication card (the embed points at a publication, not a single article). */
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
	paddingTop: space.sm,
	pointerEvents: 'none',
	position: 'relative',
	zIndex: 1,
});

export const pubSubscribeStacked = style({
	paddingTop: space.sm,
	position: 'relative',
	zIndex: 1,
});

// #endregion
