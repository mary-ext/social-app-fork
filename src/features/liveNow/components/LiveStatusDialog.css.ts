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

export const mediaFrame = style({
	inset: 0,
	position: 'absolute',
});

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

export const reportButton = style({
	background: 'none',
	display: 'flex',
	padding: 0,
	textDecoration: 'underline',
	textDecorationColor: vars.palette.contrast_700,
});

export const dialogPopup = style({
	overflow: 'hidden',
});
