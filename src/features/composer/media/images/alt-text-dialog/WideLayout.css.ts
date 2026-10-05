import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const grid = style({
	display: 'grid',
	gridTemplateColumns: 'minmax(0, 1fr) 380px',
	alignItems: 'start',
});

/** A square, so the width its column gets is what sets how tall the dialog's content ends up being. */
export const media = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'sticky',
	top: 0,
	alignItems: 'center',
	justifyContent: 'center',
	borderRight: `1px solid ${vars.palette.contrast_100}`,
	backgroundColor: vars.palette.contrast_50,
	aspectRatio: '1',
	width: '100%',
	overflow: 'hidden',
});

export const image = style({
	display: 'block',
	width: '100%',
	height: '100%',
	objectFit: 'contain',
});

/** Holds the height the media pane set, for the out-of-flow editor to fill. */
export const editorCell = style({
	position: 'relative',
	height: '100%',
});

/**
 * Taken out of flow so its length never feeds back into the grid row — however many questions pile up, the
 * media pane stays the only thing deciding how tall the dialog is, and this column scrolls instead.
 */
export const editor = style({
	boxSizing: 'border-box',
	display: 'flex',
	position: 'absolute',
	inset: 0,
	flexDirection: 'column',
	gap: space.lg,
	padding: space.lg,
	minWidth: 0,
	overflowY: 'auto',
});
