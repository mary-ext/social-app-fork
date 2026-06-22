import { style } from '@vanilla-extract/css';

import { colors } from '#/styles/colors';

export const feedFooter = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	borderTop: `1px solid ${colors.borderContrastLow}`,
	paddingBlock: 40,
});

export const emptyState = style({ paddingBlock: 40 });
