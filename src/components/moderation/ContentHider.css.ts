import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';

const viewBase = {
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
} as const;

export const passthrough = style(viewBase);

export const activeOuter = style({
	...viewBase,
	overflow: 'hidden',
});

export const panel = style(viewBase);

export const blurButton = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	alignItems: 'center',
	justifyContent: 'flex-start',
	margin: 0,
	border: 0,
	borderRadius: 8,
	backgroundColor: vars.palette.contrast_25,
	padding: 12,
	paddingInline: 13,
	width: '100%',
	textAlign: 'left',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': {
			outline: `2px solid ${vars.palette.primary_500}`,
			outlineOffset: -2,
		},
		'&:hover, &:active': {
			backgroundColor: vars.palette.contrast_50,
		},
	},
});

export const iconWrap = style({
	flexShrink: 0,
});

export const labelText = style({
	flex: 1,
});

export const toggleText = style({
	marginBottom: 1,
});

export const learnMoreButton = style({
	appearance: 'none',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'stretch',
	margin: 0,
	border: 0,
	backgroundColor: 'transparent',
	paddingTop: 8,
	paddingBottom: 0,
	paddingInline: 0,
	width: '100%',
	textAlign: 'left',
	cursor: 'pointer',
	selectors: {
		'&:focus-visible': {
			outline: 'none',
		},
	},
});

export const learnMoreLink = style({
	borderRadius: 2,
	selectors: {
		[`${learnMoreButton}:focus-visible &`]: {
			textDecoration: 'underline',
		},
		[`${learnMoreButton}:hover &`]: {
			textDecoration: 'underline',
		},
	},
});
