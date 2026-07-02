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
	borderRadius: 8,
	borderWidth: 1,
	borderStyle: 'solid',
	borderColor: vars.palette.contrast_200,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	paddingBlock: space.xl,
	backgroundColor: vars.palette.contrast_25,
});

export const errorContainer = style([
	contentContainer,
	{
		alignItems: 'flex-start',
		padding: space.md,
		gap: space.xs,
		flexDirection: 'column',
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
