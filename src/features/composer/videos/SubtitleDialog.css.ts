import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { iconSize } from '#/styles/tokens.css';

const icon = style({
	gridArea: 'icon',
	width: iconSize.sm,
	height: iconSize.sm,
});

export const fileIcon = style([icon, { color: vars.palette.contrast_1000 }]);

export const warningIcon = style([icon, { color: vars.palette.negative_500 }]);

export const captionsList = style({
	containerType: 'inline-size',
});

export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	marginBlock: 4,
});

export const errorText = style({
	marginTop: 12,
	color: vars.palette.negative_500,
});

export const footer = style({
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	marginTop: 16,
});

export const row = style({
	display: 'grid',
	gridTemplateAreas: `
		"icon file close"
		". language ."
	`,
	gridTemplateColumns: 'auto 1fr auto',
	rowGap: 8,
	columnGap: 12,
	alignItems: 'center',
	borderRadius: 8,
	paddingBlock: 12,
	paddingInline: 16,
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
