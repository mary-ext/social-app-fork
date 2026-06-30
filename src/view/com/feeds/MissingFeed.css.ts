import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const popup = style({
	maxWidth: 500,
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
});

export const divider = style({
	borderTop: `1px solid ${colors.borderContrastLow}`,
	marginBlock: space.md,
	width: '100%',
});

export const profileRow = style({
	alignItems: 'flex-start',
	display: 'flex',
	flexDirection: 'column',
	width: '100%',
});

export const italic = style({
	fontStyle: 'italic',
});

export const labelSpaced = style({
	marginTop: space.md,
});

export const notice = style({
	display: 'block',
	fontStyle: 'italic',
	width: '100%',
});
