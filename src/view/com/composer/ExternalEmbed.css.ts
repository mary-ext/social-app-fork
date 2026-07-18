import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const container = style({
	position: 'relative',
	borderRadius: 8,
	overflow: 'hidden',
});

export const linkContainer = style([
	container,
	{
		marginBottom: space.md,
	},
]);

export const contentContainer = style({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderWidth: 1,
	borderStyle: 'solid',
	borderRadius: 8,
	borderColor: vars.palette.contrast_200,
	backgroundColor: vars.palette.contrast_25,
	paddingBlock: space.xl,
});

export const errorContainer = style([
	contentContainer,
	{
		flexDirection: 'column',
		gap: space.xs,
		alignItems: 'flex-start',
		padding: space.md,
	},
]);

export const textNegative = style({
	color: vars.palette.negative_400,
});

export const pointerEventsNone = style({
	pointerEvents: 'none',
});

export const pointerEventsAuto = style({
	pointerEvents: 'auto',
});
