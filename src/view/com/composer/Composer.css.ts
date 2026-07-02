import { style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { space } from '#/styles/tokens.css';

export const dialogBody = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minHeight: 0,
	overflow: 'hidden',
});

export const scrollContainer = style({
	display: 'flex',
	flexDirection: 'column',
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	scrollbarGutter: 'stable',
	scrollbarColor: `${vars.palette.contrast_200} transparent`,
});

export const stickyFooterWeb = style({
	position: 'sticky',
	bottom: 0,
	zIndex: 2,
	backgroundColor: vars.palette.contrast_0,
	marginBottom: space.lg,

	':last-child': {
		marginBottom: 0,
	},
});

export const inactivePost = style({
	opacity: 0.5,

	':last-child': {
		marginBottom: space.lg,
	},
});

export const postContainer = style({
	display: 'flex',
	flexDirection: 'column',
	paddingLeft: space.lg,
	paddingRight: space.lg,
	position: 'relative',

	selectors: {
		'& + &': {
			marginTop: space.md,
		},
	},
});

export const row = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.md,
	position: 'relative',
	zIndex: 0,
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
	width: '100%',
	marginTop: space.lg,
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
