import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const rowBase = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
});

export const row = styleVariants({
	lg: [rowBase, { gap: 5 }],
	sm: [rowBase, { gap: 3 }],
});

// the pill: a borderless, fully-rounded flex row that highlights on hover/press. its resting background is
// opt-in (`pillBg`) so `sm` pills — which PostAlerts renders with `noBg` — stay transparent until hovered.
const pillBase = style({
	alignItems: 'center',
	background: 'none',
	border: 'none',
	borderRadius: 999,
	boxSizing: 'border-box',
	color: vars.palette.contrast_700,
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 0,
	maxWidth: '100%',
	minWidth: 0,
	selectors: {
		'&:active': { backgroundColor: vars.palette.contrast_50 },
		'&:hover': { backgroundColor: vars.palette.contrast_50 },
	},
});

export const pill = styleVariants({
	lg: [pillBase, { gap: 5, padding: 5 }],
	sm: [pillBase, { gap: 3, padding: 3 }],
});

export const pillBg = style({
	backgroundColor: vars.palette.contrast_25,
});

export const pillText = style({
	paddingRight: 3,
});
