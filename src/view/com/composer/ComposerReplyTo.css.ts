import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const container = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	alignItems: 'flex-start',
	marginRight: space.lg,
	marginBottom: space.lg,
	marginLeft: space.lg,
	borderBottomWidth: 1,
	borderBottomStyle: 'solid',
	borderBottomColor: vars.palette.contrast_200,
	paddingBottom: space.lg,
	cursor: 'pointer',
	userSelect: 'text',
});

export const content = style({
	display: 'flex',
	flex: 1,
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
	display: 'flex',
	position: 'relative',
	flexDirection: 'column',
	flexShrink: 0,
	borderRadius: 4,
	width: 64,
	height: 64,
	overflow: 'hidden',
});

export const image = style({
	flexBasis: 0,
	flexGrow: 1,
	width: '100%',
	minWidth: 0,
	height: '100%',
	minHeight: 0,
	objectFit: 'cover',
});

export const imagesRow = style({
	display: 'flex',
	flexBasis: 0,
	flexDirection: 'row',
	flexGrow: 1,
	gap: 2,
});

export const imagesCol = style({
	display: 'flex',
	flexBasis: 0,
	flexDirection: 'column',
	flexGrow: 1,
	gap: 2,
});

export const imageOverlayWrapper = style({
	display: 'flex',
	position: 'relative',
	flex: 1,
	flexDirection: 'column',
	flexGrow: 1,
});

export const imageOverlay = style({
	display: 'flex',
	position: 'absolute',
	inset: 0,
	alignItems: 'center',
	justifyContent: 'center',
	backgroundColor: 'rgba(0, 0, 0, 0.5)',
});
