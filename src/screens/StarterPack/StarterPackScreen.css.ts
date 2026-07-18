import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

export const error = {
	root: style(
		{
			display: 'flex',
			flexDirection: 'row',
			gap: space.sm,
			marginBottom: space.lg,
			border: `1px solid ${vars.palette.contrast_200}`,
			borderRadius: borderRadius.sm,
			backgroundColor: vars.palette.contrast_25,
			padding: space.md,
		},
		'error_root',
	),
	body: style(
		{
			display: 'flex',
			flex: '1 1 0%',
			flexDirection: 'column',
			gap: space._2xs,
		},
		'error_body',
	),
};

export const invalidOuter = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space._5xl,
	alignItems: 'center',
	paddingBlock: space._4xl,
	paddingInline: space.xl,
});

export const invalidHeader = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	alignItems: 'center',
	width: '100%',
});

export const invalidBody = style({
	maxWidth: 450,
});

export const invalidActions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	width: '100%',
	maxWidth: 350,
});

export const invalidButton = style({
	width: '100%',
});
