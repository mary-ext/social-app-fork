import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const card = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'stretch',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 8,
	borderColor: vars.palette.contrast_100,
	backgroundColor: vars.palette.contrast_0,
	width: '100%',
	overflow: 'hidden',
});

export const thumb = style({
	backgroundColor: vars.palette.contrast_25,
	width: 114,
	minHeight: 64,
});

export const body = style({
	boxSizing: 'border-box',
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: 4,
	justifyContent: 'center',
	paddingBlock: 8,
	paddingInline: 12,
	minWidth: 0,
});

export const domainRow = style({
	display: 'flex',
	flexDirection: 'row',
	gap: 2,
	alignItems: 'center',
});

const skeleton = {
	borderRadius: 6,
	backgroundColor: vars.palette.contrast_50,
} as const;

export const skeletonTitle = style({ ...skeleton, width: 128, height: 16 });
export const skeletonDomain = style({ ...skeleton, width: 72, height: 12 });
