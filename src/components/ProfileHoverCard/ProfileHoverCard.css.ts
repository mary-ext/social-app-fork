import { createVar, fallbackVar, style } from '@vanilla-extract/css';

import { vars } from '#/styles/contract.css';
import { borderRadius, space } from '#/styles/tokens.css';

const hidden = {
	transform: 'scale(0.97)',
	opacity: 0,
};

/** measured size of the popup's content. */
export const contentSizeVars = {
	blockSize: createVar('contentBlockSize'),
	inlineSize: createVar('contentInlineSize'),
};

export const popup = style({
	transformOrigin: 'var(--transform-origin)',
	transitionDuration: '200ms',
	transitionProperty: 'opacity, transform, block-size, inline-size',
	transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
	boxSizing: 'content-box',
	blockSize: fallbackVar(contentSizeVars.blockSize, 'auto'),
	inlineSize: fallbackVar(contentSizeVars.inlineSize, 'auto'),
	border: `1px solid ${vars.palette.contrast_100}`,
	borderRadius: borderRadius.md,
	boxShadow: vars.shadow.lg,
	backgroundColor: vars.palette.contrast_0,
	overflow: 'hidden',
	selectors: {
		'&[data-closed]': hidden,
	},
	'@starting-style': hidden,
	'@media': {
		'(prefers-reduced-motion: reduce)': {
			transitionProperty: 'opacity, transform',
		},
	},
});

export const content = style({
	inlineSize: 'max-content',
});

const baseCard = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
});

export const liveCard = style([
	baseCard,
	{
		width: 350,
	},
]);

export const profileCard = style([
	baseCard,
	{
		padding: space.lg,
		width: 300,
	},
]);

export const loadingCard = style([
	baseCard,
	{
		alignItems: 'center',
		justifyContent: 'center',
		width: 300,
		minHeight: 200,
	},
]);

export const errorCard = style([
	loadingCard,
	{
		gap: space.xs,
		padding: space.lg,
		textAlign: 'center',
	},
]);

export const headerRow = style({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
});

export const avatarLink = style({
	display: 'inline-flex',
	alignSelf: 'flex-start',
});

export const nameLink = style({
	display: 'flex',
	flexDirection: 'column',
	gap: space.xs,
	paddingTop: space.md,
	paddingBottom: space.sm,
	textDecoration: 'none',
	selectors: {
		'&:last-child': {
			paddingBottom: 0,
		},
	},
});

export const statsRow = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.md,
	paddingTop: space.xs,
});

export const pills = style({
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'wrap',
	gap: space.xs,
});

export const description = style({
	paddingTop: space.md,
});

export const knownFollowers = style({
	display: 'flex',
	flexDirection: 'row',
	gap: space.sm,
	alignItems: 'center',
	paddingTop: space.md,
});
