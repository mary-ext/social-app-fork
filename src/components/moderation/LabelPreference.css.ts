import { style } from '@vanilla-extract/css';

import { space } from '#/styles/tokens.css';

// a static label row's subtitle area: the label description stacked over the "configured elsewhere" note,
// placed in the row grid's second line beside (under) the title.
export const details = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	gridColumn: '2 / 4',
	gridRow: 2,
	minWidth: 0,
});

// the muted italic note ("configured in moderation settings" / "adult content is disabled") with its info icon.
export const note = style({
	alignItems: 'center',
	display: 'flex',
	gap: space.xs,
});
