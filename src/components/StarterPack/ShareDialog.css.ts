import { style } from '@vanilla-extract/css';

import { CARD_ASPECT_RATIO } from '#/lib/constants';

import { borderRadius, space } from '#/styles/tokens.css';

// past the 800px breakpoint the dialog reads as a centered desktop card: tighter gaps, the preview
// nudged up and scaled in, and the action laid out as a centered row.
const gtMobile = '(min-width: 800px)';

export const loading = style({
	alignItems: 'center',
	display: 'flex',
	justifyContent: 'center',
	minHeight: 384,
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.lg,
	'@media': {
		[gtMobile]: { gap: 0 },
	},
});

export const header = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.sm,
	'@media': {
		[gtMobile]: { paddingBottom: space.lg },
	},
});

export const image = style({
	aspectRatio: String(CARD_ASPECT_RATIO),
	borderRadius: borderRadius.sm,
	objectFit: 'cover',
	width: '100%',
	'@media': {
		[gtMobile]: { marginTop: -20, transform: 'scale(0.85)' },
	},
});

export const actions = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.md,
	'@media': {
		[gtMobile]: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
	},
});
