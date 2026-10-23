import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

import { label as sectionLabel } from './SectionLabelRow.css';
import { removeButtonEnd } from './shared.css';

export const label = style([sectionLabel]);

export const row = style({
	display: 'flex',
	gap: space.sm,
	alignItems: 'center',
	justifyContent: 'space-between',
	paddingInlineEnd: removeButtonEnd,
});

export const clear = style({
	flexShrink: 0,
});
