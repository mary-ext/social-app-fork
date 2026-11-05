import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

export const errorText = style({ marginTop: space.xs });

export const pronounsSection = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
});

// sized like the link pills, starting with text and ending in a grip-sized pencil.
export const pronounsPill = style({
	maxWidth: '100%',
	paddingBlock: 6,
	paddingRight: 8,
	paddingLeft: 12,
	color: colors.text,
});

export const suggestions = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.sm,
});
