import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { space } from '#/styles/tokens.css';

/** A person/feed row: avatar + name/handle + a trailing checkbox or remove button. */
export const row = style({
	alignItems: 'center',
	borderBottom: `1px solid ${colors.borderContrastLow}`,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	paddingBlock: space.md,
	paddingInline: space.lg,
	width: '100%',
});

// `min-width: 0` lets the name/handle ellipsize instead of overrunning the row (flex items default to
// `min-width: auto`, which floors at content width and defeats the single-line clamp). `flex: 1` also
// pushes the trailing checkbox/remove control to the row's end.
export const textCol = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	gap: space._2xs,
	minWidth: 0,
});
