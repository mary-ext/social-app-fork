import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

// allows the checkbox group to appear between radio options
export const radioGroup = style({
	display: 'contents',
});

export const afterNest = style({
	order: 2,
});

export const nest = style({
	order: 1,
	marginBlock: 1,
});

// the checkbox group already separates "nobody" from the preceding option
globalStyle(`${radioGroup}:has(~ ${nest}) > ${afterNest}::before`, {
	display: 'none',
});

export const pill = style({
	borderRadius: 999,
	backgroundColor: vars.palette.primary_50,
	paddingBlock: 2,
	paddingInline: 8,
	color: vars.palette.primary_600,
});
