import { keyframes, style } from '@vanilla-extract/css';

import { recipe } from '#/styles/recipe';

export const views = style({
	display: 'flex',
	flex: 1,
	flexDirection: 'column',
	overflow: 'hidden',
	minHeight: 0,
});

const push = keyframes({
	from: { transform: 'translateX(40px)', opacity: 0 },
});

const pop = keyframes({
	from: { transform: 'translateX(-40px)', opacity: 0 },
});

const fade = keyframes({
	from: { opacity: 0 },
});

const animated = (animation: string) => ({
	animation,
	'@media': {
		'(prefers-reduced-motion: reduce)': { animation: 'none' },
	},
});

export const view = recipe(
	{
		base: {
			display: 'flex',
			flex: 1,
			flexDirection: 'column',
			minHeight: 0,
			selectors: {
				'&[hidden]': { display: 'none' },
			},
		},
		variants: {
			transition: {
				fade: animated(`${fade} 150ms ease-out`),
				none: {},
				pop: animated(`${pop} 240ms cubic-bezier(0.16, 1, 0.3, 1)`),
				push: animated(`${push} 240ms cubic-bezier(0.16, 1, 0.3, 1)`),
			},
		},
	},
	{ debugId: 'view' },
);
