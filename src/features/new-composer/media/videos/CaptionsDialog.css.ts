import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { recipe } from '#/styles/recipe';
import { iconSize } from '#/styles/tokens.css';

export const body = style({
	display: 'flex',
	flexDirection: 'column',
	gap: 16,
	paddingBlockEnd: 16,
	paddingInline: 16,
});

export const list = style({
	flexShrink: 0,
	containerType: 'inline-size',
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: 10,
	overflow: 'hidden',
});

export const row = style({
	display: 'grid',
	gridTemplateAreas: `
		"icon name remove"
		". language ."
	`,
	gridTemplateColumns: 'auto minmax(0, 1fr) auto',
	rowGap: 8,
	columnGap: 10,
	alignItems: 'center',
	paddingBlock: 10,
	paddingInline: '12px 8px',
	selectors: {
		'& + &': { borderTop: `1px solid ${vars.palette.contrast_100}` },
	},
	'@container': {
		'(min-width: 380px)': {
			gridTemplateAreas: '"icon name language remove"',
			gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 150px) auto',
		},
	},
});

export const icon = style({
	gridArea: 'icon',
	width: iconSize.md,
	height: iconSize.md,
	color: vars.palette.contrast_600,
});

export const name = style({
	gridArea: 'name',
	display: 'flex',
	flexDirection: 'column',
	gap: 2,
	minWidth: 0,
});

export const language = style({
	gridArea: 'language',
	minWidth: 0,
});

export const remove = style({
	gridArea: 'remove',
});

// implicit error rows avoid an empty gap when there's no message.
export const message = style({
	gridColumn: '2 / -2',
	display: 'flex',
	gap: 6,
	alignItems: 'flex-start',
});

export const messageIcon = style({
	flexShrink: 0,
	// center on the first line of text.
	marginTop: 1,
	width: iconSize.sm,
	height: iconSize.sm,
	color: vars.palette.negative_600,
});

export const dropZone = recipe(
	{
		base: {
			display: 'flex',
			flexShrink: 0,
			flexWrap: 'wrap',
			gap: 10,
			alignItems: 'center',
			justifyContent: 'center',
			border: `1.5px dashed ${vars.palette.contrast_200}`,
			borderRadius: 10,
			padding: 12,
			minHeight: 60,
		},
		variants: {
			active: {
				false: {},
				true: {
					borderColor: vars.palette.primary_500,
					backgroundColor: vars.palette.primary_25,
				},
			},
		},
	},
	{ debugId: 'dropZone' },
);
