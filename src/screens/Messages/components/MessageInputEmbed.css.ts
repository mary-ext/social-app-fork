import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

export const embed = style({
	marginTop: space.sm,
});

export const postAlerts = style({
	paddingBlock: space.xs,
});

export const inviteState = style({
	minHeight: 64,
});
