import { keyframes, style } from '@vanilla-extract/css';

import { DIALOG_PADDING, SEARCH_FADE, SEARCH_OVERLAP } from '#/features/gifPicker/layout';

import { colors } from '#/styles/colors';
import { withAlpha } from '#/styles/functions';
import { recipe } from '#/styles/recipe';
import { space, zIndex } from '#/styles/tokens.css';

export const header = style({
	boxSizing: 'border-box',
	display: 'flex',
	flexShrink: 0,
	gap: space.lg,
	alignItems: 'center',
	backgroundColor: colors.bg,
	paddingTop: DIALOG_PADDING,
	paddingBottom: space.md,
	paddingInline: DIALOG_PADDING,
});

// overlaps the top of the views so scrolled GIFs fade out beneath the field.
export const search = style({
	flexShrink: 0,
	zIndex: zIndex.raised,
	marginBottom: -SEARCH_OVERLAP,
	backgroundImage: `linear-gradient(${colors.bg} 50%, ${withAlpha(colors.bg, '0%')})`,
	paddingBottom: SEARCH_FADE,
	paddingInline: DIALOG_PADDING,
});

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
