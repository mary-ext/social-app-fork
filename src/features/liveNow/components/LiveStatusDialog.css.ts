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
	position: 'relative',
	backgroundColor: vars.palette.contrast_25,
	aspectRatio: String(CARD_ASPECT_RATIO),
	width: '100%',
	overflow: 'hidden',
});

export const mediaFrame = style({
	position: 'absolute',
	inset: 0,
});

export const liveBadge = style({
	top: space.lg,
	right: 'auto',
	bottom: 'auto',
	left: space.lg,
	justifyContent: 'flex-start',
});

export const info = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
	width: '100%',
});

export const domain = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space._2xs,
	alignItems: 'center',
});

export const watchButton = style({
	width: '100%',
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_100}`,
	width: '100%',
});

export const betaRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingTop: space.sm,
	width: '100%',
});

export const beta = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'center',
});

export const reportButton = style({
	display: 'flex',
	background: 'none',
	padding: 0,
	textDecoration: 'underline',
	textDecorationColor: vars.palette.contrast_700,
});

export const dialogPopup = style({
	overflow: 'hidden',
});
