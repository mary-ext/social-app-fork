import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// the form page's gutter: horizontal padding with vertical rhythm between the notice, form, and any error.
export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xl,
	paddingBlock: space.lg,
	paddingInline: space.lg,
	width: '100%',
});

export const loaderWrap = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	padding: space.xl,
});
