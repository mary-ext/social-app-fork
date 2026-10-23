import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';
import { borderRadius } from '#/styles/tokens.css';

export const logo = style({
	display: 'block',
	flexShrink: 0,
	borderRadius: borderRadius.full,
	objectFit: 'cover',
});

// match LinkPill sizing.
const pill = style({
	maxWidth: '100%',
	paddingBlock: 6,
	paddingLeft: 10,
	color: colors.text,
});

export const linkPill = style([pill, { paddingRight: 10 }]);

export const selfPill = style([pill, { paddingRight: 12 }]);

export const arrow = style({
	flexShrink: 0,
	marginLeft: -4,
	width: 12,
	height: 12,
});
