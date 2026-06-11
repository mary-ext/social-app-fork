import { style, styleVariants } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const content = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	width: '100%',
});

export const padding = styleVariants({
	lg: { padding: space.lg },
	xl: { paddingBottom: space.xl, paddingInline: space.xl },
});

// the xl card tightens its top padding when media sits directly above the content
export const xlTop = styleVariants({
	noThumb: { paddingTop: space._2xl },
	thumb: { paddingTop: space.lg },
});

export const media = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	backgroundColor: vars.palette.contrast_25,
	overflow: 'hidden',
	position: 'relative',
	width: '100%',
});

export const mediaImage = style({
	height: '100%',
	inset: 0,
	objectFit: 'cover',
	position: 'absolute',
	width: '100%',
});

// pin the LIVE pill to the media's top-left instead of its default bottom-center
export const liveBadge = style({
	bottom: 'auto',
	justifyContent: 'flex-start',
	left: space.lg,
	right: 'auto',
	top: space.lg,
});

export const info = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	width: '100%',
});

export const domain = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
});

// host for an icon coloured through `currentColor`
export const mutedIcon = style({
	color: vars.palette.contrast_700,
	display: 'flex',
});

export const watchButton = style({
	width: '100%',
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const betaRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'space-between',
	paddingTop: space.sm,
	width: '100%',
});

export const beta = style({
	alignItems: 'center',
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
});

export const betaIcon = style({
	color: vars.palette.contrast_400,
	display: 'flex',
});

// a text link that triggers an action rather than navigating, so it can't be an <a>. flex (not the default
// block) so its height tracks the inner Text rather than the button's own larger line-height strut
export const reportButton = style({
	background: 'none',
	border: 'none',
	cursor: 'pointer',
	display: 'flex',
	padding: 0,
	textDecoration: 'underline',
	textUnderlineOffset: 2,
});

// touch-only live dialog: drop the popup's own padding so the media bleeds to its rounded edges
export const dialogPopup = style({
	maxWidth: 420,
	overflow: 'hidden',
	padding: 0,
});
