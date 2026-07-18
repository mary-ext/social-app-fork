import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const dialogBody = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minHeight: 0,
	overflow: 'hidden',
});

export const scrollContainer = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	minHeight: 0,
	overflowY: 'auto',
	scrollbarColor: `${vars.palette.contrast_200} transparent`,
	scrollbarGutter: 'stable',
});

export const stickyFooterWeb = style({
	position: 'sticky',
	bottom: 0,
	zIndex: 2,
	backgroundColor: vars.palette.contrast_0,
});

export const inactivePost = style({
	opacity: 0.5,
});

export const postContainer = style({
	display: 'flex',
	position: 'relative',
	flexDirection: 'row',
	flexShrink: 0,
	gap: space.md,
	zIndex: 0,
	paddingRight: space.lg,
	paddingBottom: space.md,
	paddingLeft: space.lg,

	selectors: {
		[`${stickyFooterWeb} + &`]: {
			paddingTop: space.md,
		},
	},
});

export const col = style({
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	gap: space.md,
	minWidth: 0,
});

export const remove = style({
	position: 'absolute',
	top: 1,
	right: 6,
	zIndex: 2,
});

export const gifContainer = style({
	position: 'relative',
	marginTop: space.lg,
});

export const linkContainer = style({
	position: 'relative',
	marginTop: space.lg,
});

export const videoContainer = style({
	marginTop: space.lg,
	width: '100%',
});

export const quoteContainer = style({
	position: 'relative',
	paddingBottom: space.md,
});

export const quoteContainerWithVideo = style([
	quoteContainer,
	{
		paddingTop: space.md,
	},
]);

export const quoteContainerWithoutVideo = style([
	quoteContainer,
	{
		paddingTop: space.xl,
	},
]);

export const externalEmbedRemoveBtn = style({
	position: 'absolute',
	top: 8,
	right: 8,
	zIndex: 50,
});
