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
	alignItems: 'center',
	appearance: 'none',
	backgroundColor: vars.palette.contrast_25,
	border: 0,
	borderRadius: 8,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'row',
	gap: 8,
	justifyContent: 'flex-start',
	margin: 0,
	padding: 12,
	paddingInline: 13,
	textAlign: 'left',
	width: '100%',
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
	alignItems: 'stretch',
	backgroundColor: 'transparent',
	border: 0,
	boxSizing: 'border-box',
	cursor: 'pointer',
	display: 'flex',
	flexDirection: 'column',
	margin: 0,
	paddingBottom: 0,
	paddingInline: 0,
	paddingTop: 8,
	textAlign: 'left',
	width: '100%',
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
