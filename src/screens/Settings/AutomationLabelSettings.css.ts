import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	padding: space.xl,
});

export const card = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 16,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	height: 160,
	justifyContent: 'center',
	// nudges the avatar + name block back toward the optical center
	paddingRight: 20,
});

export const identity = style({
	display: 'flex',
	flexDirection: 'column',
	minWidth: 0,
});

export const nameRow = style({
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	minWidth: 0,
});

export const displayName = style({
	flexShrink: 1,
	minWidth: 0,
});

export const heading = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const toggleRow = style({
	alignItems: 'center',
	backgroundColor: vars.palette.contrast_50,
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 16,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	padding: space.md,
	width: '100%',
});

export const toggleLabel = style({
	flexGrow: 1,
	minWidth: 0,
});

export const robotIcon = style({
	color: vars.palette.contrast_700,
	display: 'flex',
	flexShrink: 0,
	paddingRight: space.xs,
});
