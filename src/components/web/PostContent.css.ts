import { style } from '@vanilla-extract/css';

/** Wraps the revealed children once a content gate is overridden. */
export const childContainer = style({
	marginTop: 6,
});

/** Spacing below the moderation alert pills. */
export const alerts = style({
	paddingBottom: 4,
});

/**
 * Spacing below the post text before the embed/controls. `display: flex` so the wrapper hugs the text instead
 * of inflating its line box with the inherited font strut.
 */
export const richText = style({
	display: 'flex',
	flexDirection: 'column',
	marginBottom: 2,
});
