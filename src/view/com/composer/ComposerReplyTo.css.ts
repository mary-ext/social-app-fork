import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: space.md,
	paddingBottom: space.lg,
	marginBottom: space.lg,
	marginLeft: space.lg,
	marginRight: space.lg,
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: vars.palette.contrast_200,
	userSelect: 'text',
	cursor: 'pointer',
});

export const content = style({
	flex: 1,
	display: 'flex',
	flexDirection: 'column',
	gap: space._2xs,
});

export const header = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	paddingRight: space.xs,
});

export const name = style({
	flexShrink: 1,
});

export const badge = style({
	paddingLeft: space.xs,
});

export const bodyRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
});

export const flexGrow = style({
	flex: 1,
	flexGrow: 1,
});

export const imagesContainer = style({
	borderRadius: 4,
	overflow: 'hidden',
	height: 64,
	width: 64,
	flexShrink: 0,
	position: 'relative',
	display: 'flex',
	flexDirection: 'column',
});

export const image = style({
	flexGrow: 1,
	flexBasis: 0,
	minWidth: 0,
	minHeight: 0,
	width: '100%',
	height: '100%',
	objectFit: 'cover',
});

export const imagesRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 2,
	flexGrow: 1,
	flexBasis: 0,
});

export const imagesCol = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	flexGrow: 1,
	flexBasis: 0,
});

export const imageOverlayWrapper = style({
	flex: 1,
	flexGrow: 1,
	display: 'flex',
	flexDirection: 'column',
	position: 'relative',
});

export const imageOverlay = style({
	position: 'absolute',
	inset: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
});
