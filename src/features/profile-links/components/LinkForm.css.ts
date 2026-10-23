import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { vars } from '#/styles/contract.css';
import { hover } from '#/styles/interaction';
import { iconSize, space } from '#/styles/tokens.css';

export const providerNote = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.xs,
	alignItems: 'flex-start',
	color: colors.positive_700,
});

export const providerNoteLogo = style({
	flexShrink: 0,
	marginTop: 2,
	width: iconSize.xs,
	height: iconSize.xs,
});

export const providerNoteText = style({
	flex: 1,
	color: 'inherit',
});

export const supportSave = style({
	backgroundColor: vars.surface.support,
	selectors: {
		[hover(':not(:disabled)')]: { backgroundColor: vars.surface.supportHover },
	},
});
