import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const postAlerts = style({
	paddingBlock: space.xs,
});

// give the loading / unavailable invite states a consistent minimum height in the composer input.
export const inviteState = style({
	minHeight: 64,
});
