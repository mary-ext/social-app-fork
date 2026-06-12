import { style } from '@vanilla-extract/css';

export const wrap = style({
	// cancel the storybook page gutter so the full-bleed settings rows align to the edge
	marginInline: -20,
});

export const heading = style({
	marginLeft: 20,
	paddingBottom: 12,
});
