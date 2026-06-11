import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// in a chat list row the alerts must not widen the row, so clip overflow and keep them within the cell.
export const postAlerts = style({
	maxWidth: '100%',
	overflow: 'hidden',
	paddingBottom: space._2xs,
});
