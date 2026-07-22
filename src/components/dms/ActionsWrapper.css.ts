import { recipe } from '#/styles/recipe';
import { space } from '#/styles/tokens.css';

export const root = recipe(
	{
		base: {
			display: 'flex',
			flex: '1 1 0',
		},
		variants: {
			fromSelf: {
				true: { flexDirection: 'row' },
				false: { flexDirection: 'row-reverse' },
			},
		},
	},
	{ debugId: 'actionsWrapperRoot' },
);

// the emoji + options rail; `auto` margin pushes it to the far edge of the row.
export const actions = recipe(
	{
		base: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			transition: 'opacity 150ms ease',
			opacity: 0,
			selectors: {
				'&:has([data-popup-open], :focus-visible)': {
					transition: 'none',
					opacity: 1,
				},
				'div:hover > &': {
					opacity: 1,
				},
			},
		},
		variants: {
			fromSelf: {
				true: { flexDirection: 'row-reverse', marginLeft: 'auto', marginRight: space.xs },
				false: { flexDirection: 'row', marginLeft: space.xs, marginRight: 'auto' },
			},
		},
	},
	{ debugId: 'actionsWrapperActions' },
);

export const content = recipe(
	{
		base: {
			display: 'flex',
			flexDirection: 'column',
			maxWidth: '80%',
		},
		variants: {
			fromSelf: {
				true: { alignItems: 'flex-end' },
				false: { alignItems: 'flex-start' },
			},
		},
	},
	{ debugId: 'actionsWrapperContent' },
);
