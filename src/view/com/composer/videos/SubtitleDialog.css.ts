import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const icon = style({ gridArea: 'icon' });

export const captionsList = style({
	containerType: 'inline-size',
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	marginBlock: 4,
});

export const errorText = style({
	color: vars.palette.negative_500,
	marginTop: 12,
});

export const footer = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	marginTop: 16,
});

export const row = style({
	alignItems: 'center',
	borderRadius: 8,
	columnGap: 12,
	display: 'grid',
	gridTemplateAreas: `
		"icon file close"
		". language ."
	`,
	gridTemplateColumns: 'auto 1fr auto',
	paddingBlock: 12,
	paddingInline: 16,
	rowGap: 8,
	'@container': {
		'(min-width: 420px)': {
			gridTemplateAreas: '"icon file language close"',
			gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 1fr) auto',
		},
	},
});

export const rowAlt = style({
	backgroundColor: vars.palette.contrast_25,
});

export const fileName = style({
	gridArea: 'file',
	marginBottom: 2,
	minWidth: 0,
});

export const language = style({
	gridArea: 'language',
	minWidth: 0,
});

export const close = style({
	gridArea: 'close',
});
