import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

export const icon = style({ gridArea: 'icon' });

// query container for the caption rows: rows wrap their language picker below the filename once the
// dialog gets narrow (a phone-width sheet is ~285px vs ~560px on desktop).
export const captionsList = style({
	containerType: 'inline-size',
});

// the button sits in its own row in the composer footer, mirroring the RN flex-row wrapper it replaces.
export const buttonRow = style({
	display: 'flex',
	flexDirection: 'row',
	marginBlock: 4,
});

// vertical stack for the dialog body; the Popup supplies its own padding.
export const container = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 12,
});

export const divider = style({
	borderTop: `1px solid ${vars.palette.contrast_200}`,
	marginBlock: 12,
	width: '100%',
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

// narrow (default): the language picker drops to its own row under the filename, leaving
// `| icon | file | close |` on top. wide: everything on one row `| icon | file | language | close |`.
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
	// let the 1fr track shrink the filename below its content width so it can ellipsize
	minWidth: 0,
});

// wraps the Select (whose trigger is `width: 100%`): shares a flexible column with the filename when
// wide, and spans the full row when wrapped beneath it. minWidth:0 lets the trigger value ellipsize.
export const language = style({
	gridArea: 'language',
	minWidth: 0,
});

export const close = style({
	gridArea: 'close',
});
